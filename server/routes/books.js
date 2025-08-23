const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validateBook, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all books (with optional search and pagination)
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const { search, category, author, available_only } = req.query;
    const { page, limit, offset } = req.pagination;

    let whereClause = 'WHERE 1=1';
    let binds = {};
    let bindCounter = 1;

    // Search by title or author
    if (search) {
      whereClause += ` AND (UPPER(title) LIKE :search${bindCounter} OR UPPER(author) LIKE :search${bindCounter + 1})`;
      binds[`search${bindCounter}`] = `%${search.toUpperCase()}%`;
      binds[`search${bindCounter + 1}`] = `%${search.toUpperCase()}%`;
      bindCounter += 2;
    }

    // Filter by category
    if (category) {
      whereClause += ` AND UPPER(category) = :category${bindCounter}`;
      binds[`category${bindCounter}`] = category.toUpperCase();
      bindCounter++;
    }

    // Filter by author
    if (author) {
      whereClause += ` AND UPPER(author) LIKE :author${bindCounter}`;
      binds[`author${bindCounter}`] = `%${author.toUpperCase()}%`;
      bindCounter++;
    }

    // Filter available books only
    if (available_only === 'true') {
      whereClause += ' AND available_copies > 0';
    }

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(*) as total FROM books ${whereClause}`,
      binds
    );
    const totalBooks = countResult.rows[0].TOTAL;

    // Get books with pagination
    const booksResult = await db.execute(
      `SELECT * FROM (
         SELECT b.*, ROW_NUMBER() OVER (ORDER BY b.title) as rn
         FROM books b ${whereClause}
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        ...binds,
        offset,
        limit: offset + limit
      }
    );

    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      books: booksResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch books'
    });
  }
});

// Get available books (public view)
router.get('/available', validatePagination, async (req, res) => {
  try {
    const { search, category } = req.query;
    const { page, limit, offset } = req.pagination;

    let whereClause = 'WHERE status = \'AVAILABLE\' AND available_copies > 0';
    let binds = {};
    let bindCounter = 1;

    if (search) {
      whereClause += ` AND (UPPER(title) LIKE :search${bindCounter} OR UPPER(author) LIKE :search${bindCounter + 1})`;
      binds[`search${bindCounter}`] = `%${search.toUpperCase()}%`;
      binds[`search${bindCounter + 1}`] = `%${search.toUpperCase()}%`;
      bindCounter += 2;
    }

    if (category) {
      whereClause += ` AND UPPER(category) = :category${bindCounter}`;
      binds[`category${bindCounter}`] = category.toUpperCase();
      bindCounter++;
    }

    const countResult = await db.execute(
      `SELECT COUNT(*) as total FROM books ${whereClause}`,
      binds
    );
    const totalBooks = countResult.rows[0].TOTAL;

    const booksResult = await db.execute(
      `SELECT book_id, isbn, title, author, category, published_year, 
              total_copies, available_copies, status, created_at
       FROM (
         SELECT b.*, ROW_NUMBER() OVER (ORDER BY b.title) as rn
         FROM books b ${whereClause}
       ) WHERE rn > :offset AND rn <= :limit`,
      {
        ...binds,
        offset,
        limit: offset + limit
      }
    );

    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      books: booksResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get available books error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch available books'
    });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);

    if (isNaN(bookId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid book ID'
      });
    }

    const result = await db.execute(
      'SELECT * FROM books WHERE book_id = :bookId',
      { bookId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    res.json({
      book: result.rows[0]
    });

  } catch (err) {
    console.error('Get book error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch book'
    });
  }
});

// Add new book (Librarian only)
router.post('/', authenticateToken, requireRole('LIBRARIAN'), validateBook, async (req, res) => {
  try {
    const { isbn, title, author, category, published_year, total_copies } = req.body;

    // Check if ISBN already exists
    if (isbn) {
      const existingBook = await db.execute(
        'SELECT book_id FROM books WHERE isbn = :isbn',
        { isbn }
      );

      if (existingBook.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Book with this ISBN already exists'
        });
      }
    }

    // Use circulation package to add book
    const result = await db.callProcedure(
      'lexora_circulation.add_book(:isbn, :title, :author, :category, :year, :total)',
      {
        isbn: isbn || null,
        title,
        author,
        category: category || null,
        year: published_year || null,
        total: total_copies
      }
    );

    // Get the newly created book
    const newBookResult = await db.execute(
      `SELECT * FROM books 
       WHERE title = :title AND author = :author 
       ORDER BY book_id DESC 
       FETCH FIRST 1 ROWS ONLY`,
      { title, author }
    );

    res.status(201).json({
      message: 'Book added successfully',
      book: newBookResult.rows[0]
    });

  } catch (err) {
    console.error('Add book error:', err);
    
    // Handle Oracle constraint violations
    if (err.errorNum === 1) { // ORA-00001: unique constraint violated
      return res.status(409).json({
        error: 'Conflict',
        message: 'Book with this ISBN already exists'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add book'
    });
  }
});

// Update book (Librarian only)
router.put('/:id', authenticateToken, requireRole('LIBRARIAN'), validateBook, async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const { isbn, title, author, category, published_year, total_copies } = req.body;

    if (isNaN(bookId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid book ID'
      });
    }

    // Check if book exists
    const existingBook = await db.execute(
      'SELECT * FROM books WHERE book_id = :bookId',
      { bookId }
    );

    if (existingBook.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    const currentBook = existingBook.rows[0];

    // Check if ISBN already exists for another book
    if (isbn && isbn !== currentBook.ISBN) {
      const duplicateISBN = await db.execute(
        'SELECT book_id FROM books WHERE isbn = :isbn AND book_id != :bookId',
        { isbn, bookId }
      );

      if (duplicateISBN.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Another book with this ISBN already exists'
        });
      }
    }

    // Check if we can reduce total copies
    const currentLoans = currentBook.TOTAL_COPIES - currentBook.AVAILABLE_COPIES;
    if (total_copies < currentLoans) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Cannot reduce total copies below ${currentLoans} (currently loaned copies)`
      });
    }

    // Update book
    await db.execute(
      `UPDATE books 
       SET isbn = :isbn, title = :title, author = :author, 
           category = :category, published_year = :publishedYear,
           total_copies = :totalCopies, 
           available_copies = available_copies + (:totalCopies - total_copies)
       WHERE book_id = :bookId`,
      {
        isbn: isbn || null,
        title,
        author,
        category: category || null,
        publishedYear: published_year || null,
        totalCopies: total_copies,
        bookId
      }
    );

    // Get updated book
    const updatedBook = await db.execute(
      'SELECT * FROM books WHERE book_id = :bookId',
      { bookId }
    );

    res.json({
      message: 'Book updated successfully',
      book: updatedBook.rows[0]
    });

  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update book'
    });
  }
});

// Delete book (Librarian only)
router.delete('/:id', authenticateToken, requireRole('LIBRARIAN'), async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);

    if (isNaN(bookId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid book ID'
      });
    }

    // Check if book exists
    const existingBook = await db.execute(
      'SELECT * FROM books WHERE book_id = :bookId',
      { bookId }
    );

    if (existingBook.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    // Check if book has active loans
    const activeLoans = await db.execute(
      'SELECT COUNT(*) as count FROM borrowings WHERE book_id = :bookId AND status = \'ISSUED\'',
      { bookId }
    );

    if (activeLoans.rows[0].COUNT > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot delete book with active loans'
      });
    }

    // Delete book (this will cascade delete related borrowing records)
    await db.execute(
      'DELETE FROM books WHERE book_id = :bookId',
      { bookId }
    );

    res.json({
      message: 'Book deleted successfully'
    });

  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete book'
    });
  }
});

// Get book categories
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT DISTINCT category 
       FROM books 
       WHERE category IS NOT NULL 
       ORDER BY category`
    );

    const categories = result.rows.map(row => row.CATEGORY);

    res.json({
      categories
    });

  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;