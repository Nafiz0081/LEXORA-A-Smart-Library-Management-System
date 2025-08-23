const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const result = await db.execute(
      `SELECT user_id, username, role_name, member_id, active 
       FROM app_users 
       WHERE user_id = :userId AND active = 'Y'`,
      { userId: decoded.userId }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Invalid or expired token'
      });
    }

    req.user = {
      userId: result.rows[0].USER_ID,
      username: result.rows[0].USERNAME,
      role: result.rows[0].ROLE_NAME,
      memberId: result.rows[0].MEMBER_ID
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Invalid token'
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Token expired'
      });
    }
    
    console.error('Authentication error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

// Check if user can access member data (librarian or own data)
const canAccessMemberData = (req, res, next) => {
  const requestedMemberId = parseInt(req.params.memberId || req.body.memberId);
  const userRole = req.user.role;
  const userMemberId = req.user.memberId;

  // Librarians can access all member data
  if (userRole === 'LIBRARIAN') {
    return next();
  }

  // Members can only access their own data
  if (userRole === 'MEMBER' && userMemberId === requestedMemberId) {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    message: 'You can only access your own data'
  });
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // No token, continue without user context
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await db.execute(
      `SELECT user_id, username, role_name, member_id, active 
       FROM app_users 
       WHERE user_id = :userId AND active = 'Y'`,
      { userId: decoded.userId }
    );

    if (result.rows.length > 0) {
      req.user = {
        userId: result.rows[0].USER_ID,
        username: result.rows[0].USERNAME,
        role: result.rows[0].ROLE_NAME,
        memberId: result.rows[0].MEMBER_ID
      };
    }

    next();
  } catch (err) {
    // Ignore token errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  canAccessMemberData,
  optionalAuth
};