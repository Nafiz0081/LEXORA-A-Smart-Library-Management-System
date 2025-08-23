// Validation middleware for request data

const validateBook = (req, res, next) => {
  const { title, author, category, published_year, total_copies } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.length > 300) {
    errors.push('Title must be less than 300 characters');
  }

  if (!author || author.trim().length === 0) {
    errors.push('Author is required');
  } else if (author.length > 200) {
    errors.push('Author must be less than 200 characters');
  }

  if (category && category.length > 100) {
    errors.push('Category must be less than 100 characters');
  }

  if (published_year) {
    const year = parseInt(published_year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1000 || year > currentYear + 1) {
      errors.push('Published year must be a valid year');
    }
  }

  if (!total_copies || total_copies < 1) {
    errors.push('Total copies must be at least 1');
  } else if (total_copies > 9999) {
    errors.push('Total copies cannot exceed 9999');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid book data',
      details: errors
    });
  }

  next();
};

const validateMember = (req, res, next) => {
  const { full_name, email, phone } = req.body;
  const errors = [];

  if (!full_name || full_name.trim().length === 0) {
    errors.push('Full name is required');
  } else if (full_name.length > 120) {
    errors.push('Full name must be less than 120 characters');
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    } else if (email.length > 120) {
      errors.push('Email must be less than 120 characters');
    }
  }

  if (phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      errors.push('Invalid phone number format');
    } else if (phone.length > 30) {
      errors.push('Phone number must be less than 30 characters');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid member data',
      details: errors
    });
  }

  next();
};

const validateBorrowing = (req, res, next) => {
  const { member_id, book_id } = req.body;
  const errors = [];

  if (!member_id || isNaN(parseInt(member_id))) {
    errors.push('Valid member ID is required');
  }

  if (!book_id || isNaN(parseInt(book_id))) {
    errors.push('Valid book ID is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid borrowing data',
      details: errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  } else if (username.length > 50) {
    errors.push('Username must be less than 50 characters');
  }

  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid login data',
      details: errors
    });
  }

  next();
};

const validateRegister = (req, res, next) => {
  const { username, password, role_name, full_name, email } = req.body;
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  } else if (username.length > 50) {
    errors.push('Username must be less than 50 characters');
  }

  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!role_name || !['LIBRARIAN', 'MEMBER'].includes(role_name)) {
    errors.push('Role must be either LIBRARIAN or MEMBER');
  }

  if (role_name === 'MEMBER') {
    if (!full_name || full_name.trim().length === 0) {
      errors.push('Full name is required for members');
    } else if (full_name.length > 120) {
      errors.push('Full name must be less than 120 characters');
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
      } else if (email.length > 120) {
        errors.push('Email must be less than 120 characters');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid registration data',
      details: errors
    });
  }

  next();
};

const validateFinePayment = (req, res, next) => {
  const { borrow_id, paid_amount, method } = req.body;
  const errors = [];

  if (!borrow_id || isNaN(parseInt(borrow_id))) {
    errors.push('Valid borrow ID is required');
  }

  if (!paid_amount || isNaN(parseFloat(paid_amount)) || parseFloat(paid_amount) <= 0) {
    errors.push('Valid payment amount is required');
  }

  if (method && method.length > 30) {
    errors.push('Payment method must be less than 30 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid payment data',
      details: errors
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Page must be a positive integer'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Limit must be between 1 and 100'
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next();
};

module.exports = {
  validateBook,
  validateMember,
  validateBorrowing,
  validateLogin,
  validateRegister,
  validateFinePayment,
  validatePagination
};