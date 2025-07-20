const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['builder', 'supervisor', 'worker']).withMessage('Invalid role'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, phone, location, companyName, category, experience } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user data
    const userData = {
      name,
      email,
      password,
      role,
      phone
    };

    // Add role-specific fields
    if (role === 'builder') {
      userData.companyName = companyName;
    } else if (role === 'worker') {
      userData.location = location;
      userData.category = category;
      userData.experience = experience || 1;
    } else if (role === 'supervisor') {
      userData.location = location;
    }

    const user = new User(userData);
    await user.save();

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      const notification = new Notification({
        recipient: admin._id,
        sender: user._id,
        type: 'user_registration',
        title: 'New User Registration',
        message: `New ${role} ${name} has registered and needs approval`,
        relatedModel: 'User',
        relatedId: user._id,
        priority: 'medium'
      });
      await notification.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully. Awaiting admin approval.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        location: user.location,
        category: user.category
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/pending-approvals
// @desc    Get pending user approvals
// @access  Private (Admin only)
router.get('/pending-approvals', auth, authorize('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      isApproved: false, 
      role: { $ne: 'admin' } 
    }).select('-password');
    
    res.json(pendingUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/approve/:userId
// @desc    Approve user registration
// @access  Private (Admin only)
router.put('/approve/:userId', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = true;
    await user.save();

    // Create notification for approved user
    const notification = new Notification({
      recipient: user._id,
      sender: req.user._id,
      type: 'user_approved',
      title: 'Account Approved',
      message: 'Your account has been approved. You can now access the platform.',
      priority: 'high'
    });
    await notification.save();

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/reject/:userId
// @desc    Reject user registration
// @access  Private (Admin only)
router.delete('/reject/:userId', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User registration rejected and deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;