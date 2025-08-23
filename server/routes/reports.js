const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get library statistics (Librarian only)
router.get('/stats', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    // Get various library statistics
    const [totalBooks, totalMembers, activeLoans, overdueBooks, totalFines] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM books'),
      db.execute('SELECT COUNT(*) as count FROM members WHERE status = \'ACTIVE\''),
      db.execute('SELECT COUNT(*) as count FROM borrowings WHERE status = \'ISSUED\''),
      db.execute('SELECT COUNT(*) as count FROM borrowings WHERE status = \'ISSUED\' AND due_date < TRUNC(SYSDATE)'),
      db.execute('SELECT SUM(fine_amount) as total FROM borrowings WHERE fine_amount > 0')
    ]);

    // Get books by category
    const categoryStats = await db.execute(
      `SELECT category, COUNT(*) as book_count, SUM(total_copies) as total_copies
       FROM books 
       GROUP BY category 
       ORDER BY book_count DESC`
    );

    // Get member status distribution
    const memberStats = await db.execute(
      `SELECT status, COUNT(*) as member_count
       FROM members 
       GROUP BY status`
    );

    // Get monthly borrowing trends (last 12 months)
    const borrowingTrends = await db.execute(
      `SELECT TO_CHAR(issue_date, 'YYYY-MM') as month, COUNT(*) as borrowings
       FROM borrowings 
       WHERE issue_date >= ADD_MONTHS(TRUNC(SYSDATE), -12)
       GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
       ORDER BY month`
    );

    res.json({
      stats: {
        totalBooks: totalBooks.rows[0].COUNT,
        totalMembers: totalMembers.rows[0].COUNT,
        activeLoans: activeLoans.rows[0].COUNT,
        overdueBooks: overdueBooks.rows[0].COUNT,
        totalFines: totalFines.rows[0].TOTAL || 0,
        categoryDistribution: categoryStats.rows,
        memberStatusDistribution: memberStats.rows,
        borrowingTrends: borrowingTrends.rows
      }
    });

  } catch (err) {
    console.error('Get library stats error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch library statistics'
    });
  }
});

// Get popular books report (Librarian only)
router.get('/popular-books', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year', or 'all'
    const { page, limit, offset } = req.pagination;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND b.issue_date >= TRUNC(SYSDATE) - 7';
    } else if (period === 'month') {
      dateFilter = 'AND b.issue_date >= TRUNC(SYSDATE) - 30';
    } else if (period === 'year') {
      dateFilter = 'AND b.issue_date >= ADD_MONTHS(TRUNC(SYSDATE), -12)';
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(DISTINCT bk.book_id) as total
       FROM books bk
       JOIN borrowings b ON bk.book_id = b.book_id
       WHERE 1=1 ${dateFilter}`
    );
    const totalBooks = countResult.rows[0].TOTAL;

    // Get popular books with pagination
    const popularBooksResult = await db.execute(
      `SELECT * FROM (
         SELECT bk.book_id, bk.title, bk.author, bk.isbn, bk.category,
                COUNT(b.borrow_id) as borrow_count,
                ROW_NUMBER() OVER (ORDER BY COUNT(b.borrow_id) DESC) as rn
         FROM books bk
         JOIN borrowings b ON bk.book_id = b.book_id
         WHERE 1=1 ${dateFilter}
         GROUP BY bk.book_id, bk.title, bk.author, bk.isbn, bk.category
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        offset,
        limit: offset + limit
      }
    );

    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      popularBooks: popularBooksResult.rows,
      period: period || 'all',
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get popular books error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch popular books report'
    });
  }
});

// Get member activity report (Librarian only)
router.get('/member-activity', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { period, status } = req.query;
    const { page, limit, offset } = req.pagination;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND b.issue_date >= TRUNC(SYSDATE) - 7';
    } else if (period === 'month') {
      dateFilter = 'AND b.issue_date >= TRUNC(SYSDATE) - 30';
    } else if (period === 'year') {
      dateFilter = 'AND b.issue_date >= ADD_MONTHS(TRUNC(SYSDATE), -12)';
    }

    let statusFilter = '';
    if (status && ['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status.toUpperCase())) {
      statusFilter = `AND m.status = '${status.toUpperCase()}'`;
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(DISTINCT m.member_id) as total
       FROM members m
       LEFT JOIN borrowings b ON m.member_id = b.member_id
       WHERE 1=1 ${statusFilter} ${dateFilter}`
    );
    const totalMembers = countResult.rows[0].TOTAL;

    // Get member activity with pagination
    const memberActivityResult = await db.execute(
      `SELECT * FROM (
         SELECT m.member_id, m.full_name, m.email, m.status, m.join_date,
                COUNT(b.borrow_id) as total_borrows,
                COUNT(CASE WHEN b.status = 'ISSUED' THEN 1 END) as active_loans,
                SUM(b.fine_amount) as total_fines,
                MAX(b.issue_date) as last_borrow_date,
                ROW_NUMBER() OVER (ORDER BY COUNT(b.borrow_id) DESC) as rn
         FROM members m
         LEFT JOIN borrowings b ON m.member_id = b.member_id ${dateFilter}
         WHERE 1=1 ${statusFilter}
         GROUP BY m.member_id, m.full_name, m.email, m.status, m.join_date
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        offset,
        limit: offset + limit
      }
    );

    const totalPages = Math.ceil(totalMembers / limit);

    res.json({
      memberActivity: memberActivityResult.rows,
      period: period || 'all',
      status: status || 'all',
      pagination: {
        currentPage: page,
        totalPages,
        totalMembers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get member activity error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch member activity report'
    });
  }
});

// Get overdue report (Librarian only)
router.get('/overdue', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    // Get total count of overdue items
    const countResult = await db.execute(
      `SELECT COUNT(*) as total
       FROM borrowings b
       WHERE b.status = 'ISSUED' AND b.due_date < TRUNC(SYSDATE)`
    );
    const totalOverdue = countResult.rows[0].TOTAL;

    // Get overdue items with pagination
    const overdueResult = await db.execute(
      `SELECT * FROM (
         SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date,
                b.fine_amount, TRUNC(SYSDATE) - b.due_date as days_overdue,
                m.full_name as member_name, m.email as member_email, m.phone as member_phone,
                bk.title as book_title, bk.author as book_author, bk.isbn,
                ROW_NUMBER() OVER (ORDER BY b.due_date) as rn
         FROM borrowings b
         JOIN members m ON b.member_id = m.member_id
         JOIN books bk ON b.book_id = bk.book_id
         WHERE b.status = 'ISSUED' AND b.due_date < TRUNC(SYSDATE)
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        offset,
        limit: offset + limit
      }
    );

    const totalPages = Math.ceil(totalOverdue / limit);

    res.json({
      overdueItems: overdueResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalOverdue,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get overdue report error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch overdue report'
    });
  }
});

// Get fine collection report (Librarian only)
router.get('/fines', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { period, status } = req.query; // status: 'paid', 'unpaid', 'all'
    const { page, limit, offset } = req.pagination;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND b.issue_date >= TRUNC(SYSDATE) - 7';
    } else if (period === 'month') {
      dateFilter = 'AND b.issue_date >= TRUNC(SYSDATE) - 30';
    } else if (period === 'year') {
      dateFilter = 'AND b.issue_date >= ADD_MONTHS(TRUNC(SYSDATE), -12)';
    }

    let fineFilter = 'AND b.fine_amount > 0';
    if (status === 'paid') {
      fineFilter = 'AND b.fine_amount = 0 AND b.return_date IS NOT NULL';
    } else if (status === 'unpaid') {
      fineFilter = 'AND b.fine_amount > 0';
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(*) as total
       FROM borrowings b
       WHERE 1=1 ${dateFilter} ${fineFilter}`
    );
    const totalFines = countResult.rows[0].TOTAL;

    // Get fine records with pagination
    const finesResult = await db.execute(
      `SELECT * FROM (
         SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date,
                b.return_date, b.fine_amount, b.status,
                m.full_name as member_name, m.email as member_email,
                bk.title as book_title, bk.author as book_author,
                CASE WHEN b.fine_amount > 0 THEN 'UNPAID' ELSE 'PAID' END as fine_status,
                ROW_NUMBER() OVER (ORDER BY b.fine_amount DESC, b.due_date) as rn
         FROM borrowings b
         JOIN members m ON b.member_id = m.member_id
         JOIN books bk ON b.book_id = bk.book_id
         WHERE 1=1 ${dateFilter} ${fineFilter}
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        offset,
        limit: offset + limit
      }
    );

    // Get fine summary
    const summaryResult = await db.execute(
      `SELECT 
         SUM(CASE WHEN fine_amount > 0 THEN fine_amount ELSE 0 END) as total_unpaid,
         COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as unpaid_count,
         COUNT(CASE WHEN fine_amount = 0 AND return_date IS NOT NULL THEN 1 END) as paid_count
       FROM borrowings b
       WHERE 1=1 ${dateFilter} AND (b.fine_amount > 0 OR (b.fine_amount = 0 AND b.return_date IS NOT NULL))`
    );

    const totalPages = Math.ceil(totalFines / limit);

    res.json({
      fines: finesResult.rows,
      summary: summaryResult.rows[0],
      period: period || 'all',
      status: status || 'all',
      pagination: {
        currentPage: page,
        totalPages,
        totalFines,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get fines report error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch fines report'
    });
  }
});

// Get inventory report (Librarian only)
router.get('/inventory', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { category, availability } = req.query;
    const { page, limit, offset } = req.pagination;

    let whereClause = 'WHERE 1=1';
    let binds = {};
    let bindCounter = 1;

    // Filter by category
    if (category) {
      whereClause += ` AND UPPER(category) = :category${bindCounter}`;
      binds[`category${bindCounter}`] = category.toUpperCase();
      bindCounter++;
    }

    // Filter by availability
    if (availability === 'available') {
      whereClause += ' AND available_copies > 0';
    } else if (availability === 'unavailable') {
      whereClause += ' AND available_copies = 0';
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(*) as total FROM books ${whereClause}`,
      binds
    );
    const totalBooks = countResult.rows[0].TOTAL;

    // Get inventory with pagination
    const inventoryResult = await db.execute(
      `SELECT * FROM (
         SELECT b.book_id, b.title, b.author, b.isbn, b.category, b.publication_year,
                b.total_copies, b.available_copies, 
                (b.total_copies - b.available_copies) as issued_copies,
                ROUND((b.available_copies / b.total_copies) * 100, 2) as availability_percentage,
                ROW_NUMBER() OVER (ORDER BY b.title) as rn
         FROM books b ${whereClause}
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        ...binds,
        offset,
        limit: offset + limit
      }
    );

    // Get inventory summary
    const summaryResult = await db.execute(
      `SELECT 
         COUNT(*) as total_titles,
         SUM(total_copies) as total_copies,
         SUM(available_copies) as available_copies,
         SUM(total_copies - available_copies) as issued_copies,
         COUNT(CASE WHEN available_copies = 0 THEN 1 END) as out_of_stock
       FROM books ${whereClause}`,
      binds
    );

    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      inventory: inventoryResult.rows,
      summary: summaryResult.rows[0],
      filters: {
        category: category || 'all',
        availability: availability || 'all'
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get inventory report error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory report'
    });
  }
});

// Get member outstanding fines (Librarian only)
router.get('/member-fines/:memberId', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    const memberId = parseInt(req.params.memberId);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid member ID'
      });
    }

    // Check if member exists
    const memberResult = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId }
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Member not found'
      });
    }

    // Get member's outstanding fines using the function
    const outstandingResult = await db.execute(
      'SELECT lexora_reports.member_outstanding(:memberId) as outstanding_fines FROM DUAL',
      { memberId }
    );

    // Get detailed fine breakdown
    const fineBreakdownResult = await db.execute(
      `SELECT b.borrow_id, b.book_id, b.issue_date, b.due_date, b.return_date,
              b.fine_amount, b.status,
              bk.title as book_title, bk.author as book_author
       FROM borrowings b
       JOIN books bk ON b.book_id = bk.book_id
       WHERE b.member_id = :memberId AND b.fine_amount > 0
       ORDER BY b.due_date`,
      { memberId }
    );

    res.json({
      member: memberResult.rows[0],
      outstandingFines: outstandingResult.rows[0].OUTSTANDING_FINES,
      fineBreakdown: fineBreakdownResult.rows
    });

  } catch (err) {
    console.error('Get member fines error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch member fines'
    });
  }
});

module.exports = router;