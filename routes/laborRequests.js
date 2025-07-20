const express = require('express');
const { body, validationResult } = require('express-validator');
const LaborRequest = require('../models/LaborRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Default wage rates
const WAGE_RATES = {
  mason: 1200,
  helper: 800,
  carpenter: 1000,
  plumber: 1000,
  painter: 900,
  electrician: 1000
};

// @route   POST /api/labor-requests
// @desc    Create labor request
// @access  Private (Builder only)
router.post('/', auth, authorize('builder'), [
  body('location').isIn(['Kukatpally', 'Bachupally', 'Madhapur', 'Kondapur', 'Financial District', 'Nanakramguda', 'Manikonda']).withMessage('Invalid location'),
  body('category').isIn(['mason', 'helper', 'carpenter', 'plumber', 'painter', 'electrician']).withMessage('Invalid category'),
  body('numberOfWorkers').isInt({ min: 1 }).withMessage('Number of workers must be at least 1'),
  body('numberOfDays').isInt({ min: 1 }).withMessage('Number of days must be at least 1'),
  body('workAddress').notEmpty().withMessage('Work address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      location,
      category,
      numberOfWorkers,
      numberOfDays,
      withSupervisor,
      isEmergency,
      description,
      workAddress,
      contactPerson,
      previousCrew,
      preferredWorkers
    } = req.body;

    // Get wage rate for category
    const wagePerDay = WAGE_RATES[category];

    // Create labor request
    const laborRequest = new LaborRequest({
      builder: req.user._id,
      location,
      category,
      numberOfWorkers,
      numberOfDays,
      wagePerDay,
      withSupervisor: withSupervisor || false,
      isEmergency: isEmergency || false,
      description: description || '',
      workAddress,
      contactPerson,
      previousCrew: previousCrew || false,
      preferredWorkers: preferredWorkers || []
    });

    await laborRequest.save();

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      const notification = new Notification({
        recipient: admin._id,
        sender: req.user._id,
        type: isEmergency ? 'emergency_request' : 'labor_request_created',
        title: isEmergency ? 'Emergency Labor Request' : 'New Labor Request',
        message: `${req.user.name} has requested ${numberOfWorkers} ${category}(s) for ${numberOfDays} days in ${location}`,
        relatedModel: 'LaborRequest',
        relatedId: laborRequest._id,
        priority: isEmergency ? 'high' : 'medium'
      });
      await notification.save();
    }

    await laborRequest.populate('builder', 'name email companyName');
    res.status(201).json({
      message: 'Labor request created successfully',
      laborRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/labor-requests
// @desc    Get labor requests (filtered by role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    const { status, page = 1, limit = 10 } = req.query;

    // Filter based on user role
    if (req.user.role === 'builder') {
      query.builder = req.user._id;
    } else if (req.user.role === 'worker') {
      // Show requests where worker is assigned
      query['assignedWorkers.worker'] = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const laborRequests = await LaborRequest.find(query)
      .populate('builder', 'name email companyName')
      .populate('assignedWorkers.worker', 'name category experience rating')
      .populate('supervisorId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LaborRequest.countDocuments(query);

    res.json({
      laborRequests,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + laborRequests.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/labor-requests/pending
// @desc    Get pending labor requests
// @access  Private (Admin only)
router.get('/pending', auth, authorize('admin'), async (req, res) => {
  try {
    const pendingRequests = await LaborRequest.find({ status: 'pending' })
      .populate('builder', 'name email companyName phone')
      .sort({ createdAt: -1 });

    res.json(pendingRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/labor-requests/:id/approve
// @desc    Approve labor request
// @access  Private (Admin only)
router.put('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const laborRequest = await LaborRequest.findById(req.params.id);
    if (!laborRequest) {
      return res.status(404).json({ message: 'Labor request not found' });
    }

    laborRequest.status = 'approved';
    await laborRequest.save();

    // Create notification for builder
    const notification = new Notification({
      recipient: laborRequest.builder,
      sender: req.user._id,
      type: 'labor_request_approved',
      title: 'Labor Request Approved',
      message: 'Your labor request has been approved. Workers will be assigned soon.',
      relatedModel: 'LaborRequest',
      relatedId: laborRequest._id,
      priority: 'high'
    });
    await notification.save();

    await laborRequest.populate('builder', 'name email companyName');
    res.json({ message: 'Labor request approved successfully', laborRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/labor-requests/:id/reject
// @desc    Reject labor request
// @access  Private (Admin only)
router.put('/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const laborRequest = await LaborRequest.findById(req.params.id);
    if (!laborRequest) {
      return res.status(404).json({ message: 'Labor request not found' });
    }

    laborRequest.status = 'rejected';
    await laborRequest.save();

    // Create notification for builder
    const notification = new Notification({
      recipient: laborRequest.builder,
      sender: req.user._id,
      type: 'labor_request_rejected',
      title: 'Labor Request Rejected',
      message: `Your labor request has been rejected. ${reason ? 'Reason: ' + reason : ''}`,
      relatedModel: 'LaborRequest',
      relatedId: laborRequest._id,
      priority: 'medium'
    });
    await notification.save();

    res.json({ message: 'Labor request rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/labor-requests/:id/available-workers
// @desc    Get available workers for a labor request
// @access  Private (Admin only)
router.get('/:id/available-workers', auth, authorize('admin'), async (req, res) => {
  try {
    const laborRequest = await LaborRequest.findById(req.params.id);
    if (!laborRequest) {
      return res.status(404).json({ message: 'Labor request not found' });
    }

    // Find available workers in the same location and category
    const availableWorkers = await User.find({
      role: 'worker',
      category: laborRequest.category,
      location: laborRequest.location,
      isAvailable: true,
      isApproved: true,
      currentProject: null
    }).select('-password');

    res.json(availableWorkers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/labor-requests/:id/assign-worker
// @desc    Assign worker to labor request
// @access  Private (Admin only)
router.post('/:id/assign-worker', auth, authorize('admin'), async (req, res) => {
  try {
    const { workerId } = req.body;
    
    const laborRequest = await LaborRequest.findById(req.params.id);
    if (!laborRequest) {
      return res.status(404).json({ message: 'Labor request not found' });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Check if worker is already assigned
    const isAlreadyAssigned = laborRequest.assignedWorkers.some(
      assigned => assigned.worker.toString() === workerId
    );

    if (isAlreadyAssigned) {
      return res.status(400).json({ message: 'Worker is already assigned to this request' });
    }

    // Check if we have reached the required number of workers
    if (laborRequest.assignedWorkers.length >= laborRequest.numberOfWorkers) {
      return res.status(400).json({ message: 'Required number of workers already assigned' });
    }

    // Assign worker
    laborRequest.assignedWorkers.push({
      worker: workerId,
      assignedAt: new Date()
    });

    // Update worker availability
    worker.isAvailable = false;
    worker.currentProject = laborRequest._id;

    // Update labor request status if all workers are assigned
    if (laborRequest.assignedWorkers.length === laborRequest.numberOfWorkers) {
      laborRequest.status = 'in-progress';
      laborRequest.startDate = new Date();
    }

    await Promise.all([laborRequest.save(), worker.save()]);

    // Create notifications
    const notifications = [];

    // Notification for builder
    notifications.push(new Notification({
      recipient: laborRequest.builder,
      sender: req.user._id,
      type: 'worker_assigned',
      title: 'Worker Assigned',
      message: `${worker.name} has been assigned to your project. They will reach by 9 AM.`,
      relatedModel: 'LaborRequest',
      relatedId: laborRequest._id,
      priority: 'high'
    }));

    // Notification for worker
    notifications.push(new Notification({
      recipient: workerId,
      sender: req.user._id,
      type: 'worker_assigned',
      title: 'Work Assigned',
      message: `You have been assigned to a project in ${laborRequest.location}. Please reach by 9 AM.`,
      relatedModel: 'LaborRequest',
      relatedId: laborRequest._id,
      priority: 'high'
    }));

    await Promise.all(notifications.map(notif => notif.save()));

    await laborRequest.populate([
      { path: 'builder', select: 'name email companyName' },
      { path: 'assignedWorkers.worker', select: 'name category experience rating' }
    ]);

    res.json({ 
      message: 'Worker assigned successfully', 
      laborRequest 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/labor-requests/:id/complete
// @desc    Mark labor request as completed
// @access  Private (Builder only)
router.put('/:id/complete', auth, authorize('builder'), async (req, res) => {
  try {
    const { workerRatings } = req.body;
    
    const laborRequest = await LaborRequest.findOne({
      _id: req.params.id,
      builder: req.user._id
    });

    if (!laborRequest) {
      return res.status(404).json({ message: 'Labor request not found' });
    }

    laborRequest.status = 'completed';
    laborRequest.endDate = new Date();
    laborRequest.paymentStatus = 'completed';
    
    if (workerRatings && workerRatings.length > 0) {
      laborRequest.workerRatings = workerRatings;
      
      // Update worker ratings
      for (const rating of workerRatings) {
        const worker = await User.findById(rating.worker);
        if (worker) {
          // Simple average rating calculation
          worker.rating = ((worker.rating * 10) + rating.rating) / 11;
          worker.isAvailable = true;
          worker.currentProject = null;
          await worker.save();
        }
      }
    } else {
      // If no ratings provided, just make workers available
      for (const assigned of laborRequest.assignedWorkers) {
        const worker = await User.findById(assigned.worker);
        if (worker) {
          worker.isAvailable = true;
          worker.currentProject = null;
          await worker.save();
        }
      }
    }

    await laborRequest.save();

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      const notification = new Notification({
        recipient: admin._id,
        sender: req.user._id,
        type: 'work_completed',
        title: 'Work Completed',
        message: `${req.user.name} has marked the project as completed.`,
        relatedModel: 'LaborRequest',
        relatedId: laborRequest._id,
        priority: 'medium'
      });
      await notification.save();
    }

    res.json({ 
      message: 'Labor request marked as completed', 
      laborRequest 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/labor-requests/:id
// @desc    Get single labor request
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Restrict access based on role
    if (req.user.role === 'builder') {
      query.builder = req.user._id;
    } else if (req.user.role === 'worker') {
      query['assignedWorkers.worker'] = req.user._id;
    }

    const laborRequest = await LaborRequest.findOne(query)
      .populate('builder', 'name email companyName phone')
      .populate('assignedWorkers.worker', 'name category experience rating phone')
      .populate('supervisorId', 'name phone');

    if (!laborRequest) {
      return res.status(404).json({ message: 'Labor request not found' });
    }

    res.json(laborRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;