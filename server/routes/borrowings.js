const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireRole, canAccessMemberData } = require('../middleware/auth');
const { validateBorrowing, validateFinePayment, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all borrowings (Librarian only)
router.get('/', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { status, member_id, book_id, overdue } = req.query;
    const { page, limit, offset } = req.pagination;

    let whereClause = 'WHERE 1=1';
    let binds = {};
    let bindCounter = 1;

    // Filter by status
    if (status && ['ISSUED', 'RETURNED'].includes(status.toUpperCase())) {
      whereClause += ` AND b.status = :status${bindCounter}`;
      binds[`status${bindCounter}`] = status.toUpperCase();
      bindCounter++;
    }

    // Filter by member
    if (member_id) {
      const memberId = parseInt(member_id);
      if (!isNaN(memberId)) {
        whereClause += ` AND b.member_id = :memberId${bindCounter}`;
        binds[`memberId${bindCounter}`] = memberId;
        bindCounter++;
      }
    }

    // Filter by book
    if (book_id) {
      const bookId = parseInt(book_id);
      if (!isNaN(bookId)) {
        whereClause += ` AND b.book_id = :bookId${bindCounter}`;
        binds[`bookId${bindCounter}`] = bookId;
        bindCounter++;
      }
    }

    // Filter overdue books
    if (overdue === 'true') {
      whereClause += ` AND b.status = 'ISSUED' AND b.due_date < TRUNC(SYSDATE)`;
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(*) as total 
       FROM borrowings b 
       JOIN members m ON b.member_id = m.member_id 
       JOIN books bk ON b.book_id = bk.book_id 
       ${whereClause}`,
      binds
    );
    const totalBorrowings = countResult.rows[0].TOTAL;

    // Get borrowings with pagination
    const borrowingsResult = await db.execute(
      `SELECT * FROM (
         SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date, 
                b.return_date, b.fine_amount, b.status,
                m.full_name as member_name, m.email as member_email,
                bk.title as book_title, bk.author as book_author, bk.isbn,
                CASE WHEN b.status = 'ISSUED' AND b.due_date < TRUNC(SYSDATE) THEN 'Y' ELSE 'N' END as is_overdue,
                ROW_NUMBER() OVER (ORDER BY b.issue_date DESC) as rn
         FROM borrowings b 
         JOIN members m ON b.member_id = m.member_id 
         JOIN books bk ON b.book_id = bk.book_id 
         ${whereClause}
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        ...binds,
        offset,
        limit: offset + limit
      }
    );

    const totalPages = Math.ceil(totalBorrowings / limit);

    res.json({
      borrowings: borrowingsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalBorrowings,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get borrowings error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch borrowings'
    });
  }
});

// Get borrowing by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const borrowId = parseInt(req.params.id);

    if (isNaN(borrowId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid borrowing ID'
      });
    }

    const result = await db.execute(
      `SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date, 
              b.return_date, b.fine_amount, b.status,
              m.full_name as member_name, m.email as member_email, m.phone as member_phone,
              bk.title as book_title, bk.author as book_author, bk.isbn, bk.category,
              CASE WHEN b.status = 'ISSUED' AND b.due_date < TRUNC(SYSDATE) THEN 'Y' ELSE 'N' END as is_overdue
       FROM borrowings b 
       JOIN members m ON b.member_id = m.member_id 
       JOIN books bk ON b.book_id = bk.book_id 
       WHERE b.borrow_id = :borrowId`,
      { borrowId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Borrowing record not found'
      });
    }

    const borrowing = result.rows[0];

    // Check if user can access this borrowing record
    if (req.user.role !== 'LIBRARIAN' && req.user.member_id !== borrowing.MEMBER_ID) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    res.json({
      borrowing
    });

  } catch (err) {
    console.error('Get borrowing error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch borrowing record'
    });
  }
});

// Issue book (Librarian only)
router.post('/issue', authenticateToken, requireRole('LIBRARIAN'), validateBorrowing, async (req, res) => {
  try {
    const { member_id, book_id } = req.body;

    // Check if member exists and is active
    const memberResult = await db.execute(
      'SELECT * FROM members WHERE member_id = :memberId',
      { memberId: member_id }
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Member not found'
      });
    }

    const member = memberResult.rows[0];
    if (member.STATUS !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Member account is not active'
      });
    }

    // Check if book exists and is available
    const bookResult = await db.execute(
      'SELECT * FROM books WHERE book_id = :bookId',
      { bookId: book_id }
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    const book = bookResult.rows[0];
    if (book.AVAILABLE_COPIES <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Book is not available for borrowing'
      });
    }

    // Check if member already has this book issued
    const existingLoan = await db.execute(
      'SELECT borrow_id FROM borrowings WHERE member_id = :memberId AND book_id = :bookId AND status = \'ISSUED\'',
      { memberId: member_id, bookId: book_id }
    );

    if (existingLoan.rows.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Member already has this book issued'
      });
    }

    // Use circulation package to issue book
    const result = await db.callProcedure(
      'lexora_circulation.issue_book(:memberId, :bookId, :borrowId)',
      {
        memberId: member_id,
        bookId: book_id,
        borrowId: { dir: db.oracledb.BIND_OUT, type: db.oracledb.NUMBER }
      }
    );

    const newBorrowId = result.outBinds.borrowId;

    // Get the newly created borrowing record
    const newBorrowingResult = await db.execute(
      `SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date, 
              b.return_date, b.fine_amount, b.status,
              m.full_name as member_name, bk.title as book_title
       FROM borrowings b 
       JOIN members m ON b.member_id = m.member_id 
       JOIN books bk ON b.book_id = bk.book_id 
       WHERE b.borrow_id = :borrowId`,
      { borrowId: newBorrowId }
    );

    res.status(201).json({
      message: 'Book issued successfully',
      borrowing: newBorrowingResult.rows[0]
    });

  } catch (err) {
    console.error('Issue book error:', err);
    
    // Handle specific Oracle errors
    if (err.message && err.message.includes('MEMBER_LIMIT_EXCEEDED')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Member has reached the maximum borrowing limit'
      });
    }
    
    if (err.message && err.message.includes('MEMBER_HAS_OVERDUE')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Member has overdue books and cannot borrow new books'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to issue book'
    });
  }
});

// Return book (Librarian only)
router.put('/:id/return', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    const borrowId = parseInt(req.params.id);

    if (isNaN(borrowId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid borrowing ID'
      });
    }

    // Check if borrowing exists and is active
    const borrowingResult = await db.execute(
      'SELECT * FROM borrowings WHERE borrow_id = :borrowId',
      { borrowId }
    );

    if (borrowingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Borrowing record not found'
      });
    }

    const borrowing = borrowingResult.rows[0];
    if (borrowing.STATUS !== 'ISSUED') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Book is already returned'
      });
    }

    // Use circulation package to return book
    await db.callProcedure(
      'lexora_circulation.return_book(:borrowId)',
      { borrowId }
    );

    // Get updated borrowing record
    const updatedBorrowingResult = await db.execute(
      `SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date, 
              b.return_date, b.fine_amount, b.status,
              m.full_name as member_name, bk.title as book_title
       FROM borrowings b 
       JOIN members m ON b.member_id = m.member_id 
       JOIN books bk ON b.book_id = bk.book_id 
       WHERE b.borrow_id = :borrowId`,
      { borrowId }
    );

    res.json({
      message: 'Book returned successfully',
      borrowing: updatedBorrowingResult.rows[0]
    });

  } catch (err) {
    console.error('Return book error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to return book'
    });
  }
});

// Renew book (Member can renew own books, Librarian can renew any)
router.put('/:id/renew', authenticateToken, async (req, res) => {
  try {
    const borrowId = parseInt(req.params.id);

    if (isNaN(borrowId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid borrowing ID'
      });
    }

    // Check if borrowing exists and is active
    const borrowingResult = await db.execute(
      'SELECT * FROM borrowings WHERE borrow_id = :borrowId',
      { borrowId }
    );

    if (borrowingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Borrowing record not found'
      });
    }

    const borrowing = borrowingResult.rows[0];
    
    // Check access permissions
    if (req.user.role !== 'LIBRARIAN' && req.user.member_id !== borrowing.MEMBER_ID) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    if (borrowing.STATUS !== 'ISSUED') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Only issued books can be renewed'
      });
    }

    // Use circulation package to renew book
    await db.callProcedure(
      'lexora_circulation.renew_book(:borrowId)',
      { borrowId }
    );

    // Get updated borrowing record
    const updatedBorrowingResult = await db.execute(
      `SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date, 
              b.return_date, b.fine_amount, b.status,
              m.full_name as member_name, bk.title as book_title
       FROM borrowings b 
       JOIN members m ON b.member_id = m.member_id 
       JOIN books bk ON b.book_id = bk.book_id 
       WHERE b.borrow_id = :borrowId`,
      { borrowId }
    );

    res.json({
      message: 'Book renewed successfully',
      borrowing: updatedBorrowingResult.rows[0]
    });

  } catch (err) {
    console.error('Renew book error:', err);
    
    // Handle specific Oracle errors
    if (err.message && err.message.includes('RENEWAL_LIMIT_EXCEEDED')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Book has reached maximum renewal limit'
      });
    }
    
    if (err.message && err.message.includes('BOOK_RESERVED')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Book is reserved by another member and cannot be renewed'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to renew book'
    });
  }
});

// Pay fine (Member can pay own fines, Librarian can pay any)
router.post('/:id/pay-fine', authenticateToken, validateFinePayment, async (req, res) => {
  try {
    const borrowId = parseInt(req.params.id);
    const { amount } = req.body;

    if (isNaN(borrowId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid borrowing ID'
      });
    }

    // Check if borrowing exists
    const borrowingResult = await db.execute(
      'SELECT * FROM borrowings WHERE borrow_id = :borrowId',
      { borrowId }
    );

    if (borrowingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Borrowing record not found'
      });
    }

    const borrowing = borrowingResult.rows[0];
    
    // Check access permissions
    if (req.user.role !== 'LIBRARIAN' && req.user.member_id !== borrowing.MEMBER_ID) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    if (borrowing.FINE_AMOUNT <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No fine amount to pay for this borrowing'
      });
    }

    if (amount > borrowing.FINE_AMOUNT) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Payment amount cannot exceed fine amount'
      });
    }

    // Use circulation package to pay fine
    await db.callProcedure(
      'lexora_circulation.pay_fine(:borrowId, :amount)',
      { borrowId, amount }
    );

    // Get updated borrowing record
    const updatedBorrowingResult = await db.execute(
      `SELECT b.borrow_id, b.member_id, b.book_id, b.issue_date, b.due_date, 
              b.return_date, b.fine_amount, b.status,
              m.full_name as member_name, bk.title as book_title
       FROM borrowings b 
       JOIN members m ON b.member_id = m.member_id 
       JOIN books bk ON b.book_id = bk.book_id 
       WHERE b.borrow_id = :borrowId`,
      { borrowId }
    );

    res.json({
      message: 'Fine payment processed successfully',
      borrowing: updatedBorrowingResult.rows[0]
    });

  } catch (err) {
    console.error('Pay fine error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process fine payment'
    });
  }
});

// Get overdue books (Librarian only)
router.get('/overdue/list', authenticateToken, requireRole('LIBRARIAN'), validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    // Get total count of overdue books
    const countResult = await db.execute(
      `SELECT COUNT(*) as total 
       FROM borrowings b 
       WHERE b.status = 'ISSUED' AND b.due_date < TRUNC(SYSDATE)`
    );
    const totalOverdue = countResult.rows[0].TOTAL;

    // Get overdue books with pagination
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
      overdueBooks: overdueResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalOverdue,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get overdue books error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch overdue books'
    });
  }
});

module.exports = router;