const express = require('express');
const moment = require('moment');
const LaborRequest = require('../models/LaborRequest');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    let dashboardData = {};

    if (req.user.role === 'admin') {
      // Admin dashboard
      const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
      const pendingApprovals = await User.countDocuments({ isApproved: false, role: { $ne: 'admin' } });
      const totalWorkers = await User.countDocuments({ role: 'worker' });
      const availableWorkers = await User.countDocuments({ role: 'worker', isAvailable: true });
      const activeProjects = await LaborRequest.countDocuments({ status: 'in-progress' });
      const pendingRequests = await LaborRequest.countDocuments({ status: 'pending' });
      const completedProjects = await LaborRequest.countDocuments({ status: 'completed' });

      // Revenue calculation (last 30 days)
      const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
      const recentCompletedProjects = await LaborRequest.find({
        status: 'completed',
        endDate: { $gte: thirtyDaysAgo }
      });
      const totalRevenue = recentCompletedProjects.reduce((sum, project) => sum + project.totalCost, 0);

      // Worker distribution by location
      const workersByLocation = await User.aggregate([
        { $match: { role: 'worker' } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Project requests trend (last 7 days)
      const sevenDaysAgo = moment().subtract(7, 'days').toDate();
      const dailyRequests = await LaborRequest.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      dashboardData = {
        totalUsers,
        pendingApprovals,
        totalWorkers,
        availableWorkers,
        activeProjects,
        pendingRequests,
        completedProjects,
        totalRevenue,
        workersByLocation,
        dailyRequests
      };

    } else if (req.user.role === 'builder') {
      // Builder dashboard
      const myRequests = await LaborRequest.countDocuments({ builder: req.user._id });
      const activeProjects = await LaborRequest.countDocuments({ 
        builder: req.user._id, 
        status: 'in-progress' 
      });
      const completedProjects = await LaborRequest.countDocuments({ 
        builder: req.user._id, 
        status: 'completed' 
      });
      const pendingRequests = await LaborRequest.countDocuments({ 
        builder: req.user._id, 
        status: 'pending' 
      });

      // Total spent (completed projects)
      const completedProjectsData = await LaborRequest.find({
        builder: req.user._id,
        status: 'completed'
      });
      const totalSpent = completedProjectsData.reduce((sum, project) => sum + project.totalCost, 0);

      // Recent projects
      const recentProjects = await LaborRequest.find({ builder: req.user._id })
        .populate('assignedWorkers.worker', 'name category rating')
        .sort({ createdAt: -1 })
        .limit(5);

      // Previous crew (workers worked with before)
      const previousWorkers = await LaborRequest.find({
        builder: req.user._id,
        status: 'completed'
      }).populate('assignedWorkers.worker', 'name category rating location isAvailable');

      const previousCrew = [];
      previousWorkers.forEach(project => {
        project.assignedWorkers.forEach(assigned => {
          if (!previousCrew.find(w => w._id.toString() === assigned.worker._id.toString())) {
            previousCrew.push(assigned.worker);
          }
        });
      });

      dashboardData = {
        myRequests,
        activeProjects,
        completedProjects,
        pendingRequests,
        totalSpent,
        recentProjects,
        previousCrew
      };

    } else if (req.user.role === 'worker') {
      // Worker dashboard
      const assignedProjects = await LaborRequest.countDocuments({ 
        'assignedWorkers.worker': req.user._id 
      });
      const activeProjects = await LaborRequest.countDocuments({ 
        'assignedWorkers.worker': req.user._id,
        status: 'in-progress'
      });
      const completedProjects = await LaborRequest.countDocuments({ 
        'assignedWorkers.worker': req.user._id,
        status: 'completed'
      });

      // Upcoming jobs
      const upcomingJobs = await LaborRequest.find({
        'assignedWorkers.worker': req.user._id,
        status: { $in: ['approved', 'in-progress'] }
      }).populate('builder', 'name companyName phone');

      // Total earnings (completed projects)
      const completedProjectsData = await LaborRequest.find({
        'assignedWorkers.worker': req.user._id,
        status: 'completed'
      });
      
      let totalEarnings = 0;
      completedProjectsData.forEach(project => {
        totalEarnings += project.wagePerDay * project.numberOfDays;
      });

      // Attendance scorecard (last 30 days)
      const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
      const attendanceRecords = await Attendance.find({
        worker: req.user._id,
        date: { $gte: thirtyDaysAgo }
      });

      const attendanceScore = {
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(a => a.status === 'present').length,
        lateDays: attendanceRecords.filter(a => a.status === 'late').length,
        absentDays: attendanceRecords.filter(a => a.status === 'absent').length
      };

      dashboardData = {
        assignedProjects,
        activeProjects,
        completedProjects,
        upcomingJobs,
        totalEarnings,
        attendanceScore,
        isAvailable: req.user.isAvailable,
        currentProject: req.user.currentProject
      };
    }

    res.json(dashboardData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/workers-availability
// @desc    Get real-time worker availability
// @access  Private (Admin only)
router.get('/workers-availability', auth, authorize('admin'), async (req, res) => {
  try {
    const { location, category } = req.query;
    
    let query = { 
      role: 'worker', 
      isApproved: true 
    };

    if (location) query.location = location;
    if (category) query.category = category;

    const workers = await User.find(query)
      .select('name category location isAvailable currentProject rating experience');

    // Group by location and category
    const availability = {
      byLocation: {},
      byCategory: {},
      total: workers.length,
      available: workers.filter(w => w.isAvailable).length
    };

    workers.forEach(worker => {
      // By location
      if (!availability.byLocation[worker.location]) {
        availability.byLocation[worker.location] = {
          total: 0,
          available: 0,
          workers: []
        };
      }
      availability.byLocation[worker.location].total++;
      if (worker.isAvailable) {
        availability.byLocation[worker.location].available++;
      }
      availability.byLocation[worker.location].workers.push(worker);

      // By category
      if (!availability.byCategory[worker.category]) {
        availability.byCategory[worker.category] = {
          total: 0,
          available: 0,
          workers: []
        };
      }
      availability.byCategory[worker.category].total++;
      if (worker.isAvailable) {
        availability.byCategory[worker.category].available++;
      }
      availability.byCategory[worker.category].workers.push(worker);
    });

    res.json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/project-tracking
// @desc    Get project tracking data
// @access  Private
router.get('/project-tracking', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'builder') {
      query.builder = req.user._id;
    } else if (req.user.role === 'worker') {
      query['assignedWorkers.worker'] = req.user._id;
    }

    const projects = await LaborRequest.find(query)
      .populate('builder', 'name companyName')
      .populate('assignedWorkers.worker', 'name category rating')
      .sort({ createdAt: -1 });

    const trackingData = {
      active: projects.filter(p => p.status === 'in-progress'),
      pending: projects.filter(p => p.status === 'pending'),
      completed: projects.filter(p => p.status === 'completed'),
      total: projects.length
    };

    res.json(trackingData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/attendance
// @desc    Get attendance analytics
// @access  Private
router.get('/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate, workerId } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 30 days
      query.date = {
        $gte: moment().subtract(30, 'days').toDate(),
        $lte: new Date()
      };
    }

    if (req.user.role === 'worker') {
      query.worker = req.user._id;
    } else if (req.user.role === 'builder') {
      // Get attendance for projects assigned to this builder
      const builderProjects = await LaborRequest.find({ builder: req.user._id });
      query.laborRequest = { $in: builderProjects.map(p => p._id) };
    } else if (workerId && req.user.role === 'admin') {
      query.worker = workerId;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('worker', 'name category')
      .populate('laborRequest', 'location description')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(a => a.status === 'present').length,
      lateDays: attendanceRecords.filter(a => a.status === 'late').length,
      absentDays: attendanceRecords.filter(a => a.status === 'absent').length,
      totalHours: attendanceRecords.reduce((sum, a) => sum + (a.hoursWorked || 0), 0),
      totalEarnings: attendanceRecords.reduce((sum, a) => sum + (a.dailyWage || 0), 0)
    };

    res.json({
      attendanceRecords,
      summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/cost-breakdown
// @desc    Get cost breakdown analytics
// @access  Private
router.get('/cost-breakdown', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'builder') {
      query.builder = req.user._id;
    }

    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const projects = await LaborRequest.find(query);

    const breakdown = {
      byCategory: {},
      byLocation: {},
      byStatus: {},
      totalCost: 0,
      emergencyCosts: 0,
      projectCount: projects.length
    };

    projects.forEach(project => {
      const cost = project.totalCost;
      breakdown.totalCost += cost;
      
      if (project.isEmergency) {
        breakdown.emergencyCosts += project.emergencyCharge;
      }

      // By category
      if (!breakdown.byCategory[project.category]) {
        breakdown.byCategory[project.category] = { count: 0, cost: 0 };
      }
      breakdown.byCategory[project.category].count++;
      breakdown.byCategory[project.category].cost += cost;

      // By location
      if (!breakdown.byLocation[project.location]) {
        breakdown.byLocation[project.location] = { count: 0, cost: 0 };
      }
      breakdown.byLocation[project.location].count++;
      breakdown.byLocation[project.location].cost += cost;

      // By status
      if (!breakdown.byStatus[project.status]) {
        breakdown.byStatus[project.status] = { count: 0, cost: 0 };
      }
      breakdown.byStatus[project.status].count++;
      breakdown.byStatus[project.status].cost += cost;
    });

    res.json(breakdown);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;