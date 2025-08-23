const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireRole, canAccessMemberData } = require('../middleware/auth');
const { validateMember, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all members (Librarian only)
router.get('/', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { search, status } = req.query;
    const { page, limit, offset } = req.pagination;

    let whereClause = 'WHERE 1=1';
    let binds = {};
    let bindCounter = 1;

    // Search by name or email
    if (search) {
      whereClause += ` AND (UPPER(full_name) LIKE :search${bindCounter} OR UPPER(email) LIKE :search${bindCounter + 1})`;
      binds[`search${bindCounter}`] = `%${search.toUpperCase()}%`;
      binds[`search${bindCounter + 1}`] = `%${search.toUpperCase()}%`;
      bindCounter += 2;
    }

    // Filter by status
    if (status && ['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status.toUpperCase())) {
      whereClause += ` AND status = :status${bindCounter}`;
      binds[`status${bindCounter}`] = status.toUpperCase();
      bindCounter++;
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(*) as total FROM members ${whereClause}`,
      binds
    );
    const totalMembers = countResult.rows[0].TOTAL;

    // Get members with pagination
    const membersResult = await db.execute(
      `SELECT * FROM (
         SELECT m.*, ROW_NUMBER() OVER (ORDER BY m.full_name) as rn
         FROM members m ${whereClause}
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        ...binds,
        offset,
        limit: offset + limit
      }
    );

    const totalPages = Math.ceil(totalMembers / limit);

    res.json({
      members: membersResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalMembers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch members'
    });
  }
});

// Get member by ID
router.get('/:id', authenticateToken, canAccessMemberData, async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    const result = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Member not found'
      });
    }

    // Get member's active loans count
    const loansResult = await db.execute(
      'SELECT COUNT(*) as active_loans FROM borrowings WHERE member_id = :memberId AND status = \'ISSUED\'',
      { memberId }
    );

    // Get member's outstanding fines
    const finesResult = await db.execute(
      'SELECT lexora_reports.member_outstanding(:memberId) as outstanding_fines FROM DUAL',
      { memberId }
    );

    const member = result.rows[0];
    member.ACTIVE_LOANS = loansResult.rows[0].ACTIVE_LOANS;
    member.OUTSTANDING_FINES = finesResult.rows[0].OUTSTANDING_FINES;

    res.json({
      member
    });

  } catch (err) {
    console.error('Get member error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch member'
    });
  }
});

// Register new member (Librarian only)
router.post('/', authenticateToken, requireRole('LIBRARIAN'), validateMember, async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;

    // Check if email already exists
    if (email) {
      const existingEmail = await db.execute(
        'SELECT member_id FROM members WHERE email = :email',
        { email }
      );

      if (existingEmail.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Member with this email already exists'
        });
      }
    }

    // Use circulation package to register member
    const result = await db.callProcedure(
      'lexora_circulation.register_member(:name, :email, :phone, :memberId)',
      {
        name: full_name,
        email: email || null,
        phone: phone || null,
        memberId: { dir: db.oracledb.BIND_OUT, type: db.oracledb.NUMBER }
      }
    );

    const newMemberId = result.outBinds.memberId;

    // Get the newly created member
    const newMemberResult = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId: newMemberId }
    );

    res.status(201).json({
      message: 'Member registered successfully',
      member: newMemberResult.rows[0]
    });

  } catch (err) {
    console.error('Register member error:', err);
    
    // Handle Oracle constraint violations
    if (err.errorNum === 1) { // ORA-00001: unique constraint violated
      return res.status(409).json({
        error: 'Conflict',
        message: 'Member with this email already exists'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register member'
    });
  }
});

// Update member (Librarian only or own data)
router.put('/:id', authenticateToken, canAccessMemberData, validateMember, async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const { full_name, email, phone } = req.body;

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    // Check if member exists
    const existingMember = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId }
    );

    if (existingMember.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Member not found'
      });
    }

    const currentMember = existingMember.rows[0];

    // Check if email already exists for another member
    if (email && email !== currentMember.EMAIL) {
      const duplicateEmail = await db.execute(
        'SELECT member_id FROM members WHERE email = :email AND member_id != :memberId',
        { email, memberId }
      );

      if (duplicateEmail.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Another member with this email already exists'
        });
      }
    }

    // Update member
    await db.execute(
      `UPDATE members 
       SET full_name = :fullName, email = :email, phone = :phone
       WHERE member_id = :memberId`,
      {
        fullName: full_name,
        email: email || null,
        phone: phone || null,
        memberId
      }
    );

    // Get updated member
    const updatedMember = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId }
    );

    res.json({
      message: 'Member updated successfully',
      member: updatedMember.rows[0]
    });

  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update member'
    });
  }
});

// Suspend member (Librarian only)
router.put('/:id/suspend', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    // Check if member exists
    const existingMember = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId }
    );

    if (existingMember.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Member not found'
      });
    }

    // Use circulation package to suspend member
    await db.callProcedure(
      'lexora_circulation.suspend_member(:memberId)',
      { memberId }
    );

    res.json({
      message: 'Member suspended successfully'
    });

  } catch (err) {
    console.error('Suspend member error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to suspend member'
    });
  }
});

// Activate member (Librarian only)
router.put('/:id/activate', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    // Check if member exists
    const existingMember = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId }
    );

    if (existingMember.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Member not found'
      });
    }

    // Use circulation package to activate member
    await db.callProcedure(
      'lexora_circulation.activate_member(:memberId)',
      { memberId }
    );

    res.json({
      message: 'Member activated successfully'
    });

  } catch (err) {
    console.error('Activate member error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to activate member'
    });
  }
});

// Delete member (Librarian only)
router.delete('/:id', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    // Check if member exists
    const existingMember = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId }
    );

    if (existingMember.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Member not found'
      });
    }

    // Check if member has active loans
    const activeLoans = await db.execute(
      'SELECT COUNT(*) as count FROM borrowings WHERE member_id = :memberId AND status = \'ISSUED\'',
      { memberId }
    );

    if (activeLoans.rows[0].COUNT > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot delete member with active loans'
      });
    }

    // Check if member has outstanding fines
    const outstandingFines = await db.execute(
      'SELECT lexora_reports.member_outstanding(:memberId) as outstanding FROM DUAL',
      { memberId }
    );

    if (outstandingFines.rows[0].OUTSTANDING > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot delete member with outstanding fines'
      });
    }

    // Delete member (this will cascade delete related records)
    await db.execute(
      'DELETE FROM members WHERE member_id = :memberId',
      { memberId }
    );

    res.json({
      message: 'Member deleted successfully'
    });

  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete member'
    });
  }
});

// Get member's active loans
router.get('/:id/loans', authenticateToken, canAccessMemberData, async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    const result = await db.execute(
      `SELECT b.borrow_id, b.issue_date, b.due_date, b.fine_amount,
              bk.book_id, bk.title, bk.author, bk.isbn,
              CASE WHEN b.due_date < TRUNC(SYSDATE) THEN 'Y' ELSE 'N' END as is_overdue
       FROM borrowings b
       JOIN books bk ON b.book_id = bk.book_id
       WHERE b.member_id = :memberId AND b.status = 'ISSUED'
       ORDER BY b.due_date`,
      { memberId }
    );

    res.json({
      loans: result.rows
    });

  } catch (err) {
    console.error('Get member loans error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch member loans'
    });
  }
});

// Get member statistics (Librarian only)
router.get('/:id/stats', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    // Get various statistics
    const [activeLoans, totalBorrows, outstandingFines, overdueBooks] = await Promise.all([
      db.execute(
        'SELECT COUNT(*) as count FROM borrowings WHERE member_id = :memberId AND status = \'ISSUED\'',
        { memberId }
      ),
      db.execute(
        'SELECT COUNT(*) as count FROM borrowings WHERE member_id = :memberId',
        { memberId }
      ),
      db.execute(
        'SELECT lexora_reports.member_outstanding(:memberId) as outstanding FROM DUAL',
        { memberId }
      ),
      db.execute(
        `SELECT COUNT(*) as count FROM borrowings 
         WHERE member_id = :memberId AND status = 'ISSUED' AND due_date < TRUNC(SYSDATE)`,
        { memberId }
      )
    ]);

    res.json({
      stats: {
        activeLoans: activeLoans.rows[0].COUNT,
        totalBorrows: totalBorrows.rows[0].COUNT,
        outstandingFines: outstandingFines.rows[0].OUTSTANDING,
        overdueBooks: overdueBooks.rows[0].COUNT
      }
    });

  } catch (err) {
    console.error('Get member stats error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch member statistics'
    });
  }
});

module.exports = router;