const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const result = await db.execute(
      `SELECT user_id, username, password_hash, role_name, member_id, active 
       FROM app_users 
       WHERE username = :username`,
      { username }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.ACTIVE !== 'Y') {
      return res.status(401).json({
        error: 'Account Disabled',
        message: 'Your account has been disabled. Please contact an administrator.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.USER_ID,
        username: user.USERNAME,
        role: user.ROLE_NAME,
        memberId: user.MEMBER_ID
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Get member details if user is a member
    let memberDetails = null;
    if (user.ROLE_NAME === 'MEMBER' && user.MEMBER_ID) {
      const memberResult = await db.execute(
        `SELECT member_id, full_name, email, phone, status 
         FROM members 
         WHERE member_id = :memberId`,
        { memberId: user.MEMBER_ID }
      );
      
      if (memberResult.rows.length > 0) {
        memberDetails = memberResult.rows[0];
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.USER_ID,
        username: user.USERNAME,
        role: user.ROLE_NAME,
        memberId: user.MEMBER_ID,
        memberDetails
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

// Register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, password, role_name, full_name, email, phone } = req.body;

    // Check if username already exists
    const existingUser = await db.execute(
      'SELECT user_id FROM app_users WHERE username = :username',
      { username }
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Registration Failed',
        message: 'Username already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let memberId = null;

    // If registering as a member, create member record first
    if (role_name === 'MEMBER') {
      // Check if email already exists
      if (email) {
        const existingEmail = await db.execute(
          'SELECT member_id FROM members WHERE email = :email',
          { email }
        );

        if (existingEmail.rows.length > 0) {
          return res.status(409).json({
            error: 'Registration Failed',
            message: 'Email already exists'
          });
        }
      }

      // Create member record
      const memberResult = await db.execute(
        `INSERT INTO members (full_name, email, phone) 
         VALUES (:fullName, :email, :phone)
         RETURNING member_id INTO :memberId`,
        {
          fullName: full_name,
          email: email || null,
          phone: phone || null,
          memberId: { dir: db.oracledb.BIND_OUT, type: db.oracledb.NUMBER }
        }
      );

      memberId = memberResult.outBinds.memberId[0];
    }

    // Create user account
    const userResult = await db.execute(
      `INSERT INTO app_users (username, password_hash, role_name, member_id) 
       VALUES (:username, :passwordHash, :roleName, :memberId)
       RETURNING user_id INTO :userId`,
      {
        username,
        passwordHash,
        roleName: role_name,
        memberId,
        userId: { dir: db.oracledb.BIND_OUT, type: db.oracledb.NUMBER }
      }
    );

    const userId = userResult.outBinds.userId[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId,
        username,
        role: role_name,
        memberId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        userId,
        username,
        role: role_name,
        memberId
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.execute(
      `SELECT u.user_id, u.username, u.role_name, u.member_id, u.created_at,
              m.full_name, m.email, m.phone, m.join_date, m.status as member_status
       FROM app_users u
       LEFT JOIN members m ON u.member_id = m.member_id
       WHERE u.user_id = :userId AND u.active = 'Y'`,
      { userId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        userId: user.USER_ID,
        username: user.USERNAME,
        role: user.ROLE_NAME,
        createdAt: user.CREATED_AT,
        member: user.MEMBER_ID ? {
          memberId: user.MEMBER_ID,
          fullName: user.FULL_NAME,
          email: user.EMAIL,
          phone: user.PHONE,
          joinDate: user.JOIN_DATE,
          status: user.MEMBER_STATUS
        } : null
      }
    });

  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch profile'
    });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name, email, phone } = req.body;

    // Only members can update profile details
    if (req.user.role !== 'MEMBER' || !req.user.memberId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only members can update profile details'
      });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid email format'
        });
      }

      // Check if email already exists for another member
      const existingEmail = await db.execute(
        'SELECT member_id FROM members WHERE email = :email AND member_id != :memberId',
        { email, memberId: req.user.memberId }
      );

      if (existingEmail.rows.length > 0) {
        return res.status(409).json({
          error: 'Validation Error',
          message: 'Email already exists'
        });
      }
    }

    // Update member details
    await db.execute(
      `UPDATE members 
       SET full_name = :fullName, email = :email, phone = :phone
       WHERE member_id = :memberId`,
      {
        fullName: full_name,
        email: email || null,
        phone: phone || null,
        memberId: req.user.memberId
      }
    );

    res.json({
      message: 'Profile updated successfully'
    });

  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.userId;

    if (!current_password || !new_password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'New password must be at least 6 characters'
      });
    }

    // Get current password hash
    const result = await db.execute(
      'SELECT password_hash FROM app_users WHERE user_id = :userId',
      { userId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, result.rows[0].PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await db.execute(
      'UPDATE app_users SET password_hash = :passwordHash WHERE user_id = :userId',
      { passwordHash: newPasswordHash, userId }
    );

    res.json({
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to change password'
    });
  }
});

module.exports = router;