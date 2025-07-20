const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Demo routes for basic functionality testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Labor Management Platform Demo Server Running',
    timestamp: new Date().toISOString(),
    environment: 'Demo Mode - No Database Connection'
  });
});

// Mock authentication route for demo
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo credentials
  const demoUsers = {
    'admin@laborplatform.com': {
      id: 'admin123',
      name: 'Demo Admin',
      email: 'admin@laborplatform.com',
      role: 'admin',
      isApproved: true
    },
    'builder1@example.com': {
      id: 'builder123',
      name: 'Demo Builder',
      email: 'builder1@example.com',
      role: 'builder',
      companyName: 'Demo Construction Company',
      isApproved: true
    },
    'worker1@example.com': {
      id: 'worker123',
      name: 'Demo Worker',
      email: 'worker1@example.com',
      role: 'worker',
      category: 'mason',
      location: 'Kukatpally',
      isApproved: true,
      isAvailable: true
    }
  };

  const user = demoUsers[email];
  if (user && password === 'password123') {
    res.json({
      message: 'Login successful (Demo Mode)',
      token: 'demo-jwt-token-' + Date.now(),
      user: user
    });
  } else {
    res.status(400).json({ message: 'Invalid credentials. Try: admin@laborplatform.com / password123' });
  }
});

// Mock dashboard data
app.get('/api/analytics/dashboard', (req, res) => {
  const mockData = {
    totalUsers: 150,
    pendingApprovals: 5,
    totalWorkers: 105,
    availableWorkers: 78,
    activeProjects: 12,
    pendingRequests: 3,
    completedProjects: 45,
    totalRevenue: 450000,
    workersByLocation: [
      { _id: 'Kukatpally', count: 18 },
      { _id: 'Madhapur', count: 15 },
      { _id: 'Kondapur', count: 12 },
      { _id: 'Financial District', count: 10 },
      { _id: 'Bachupally', count: 8 },
      { _id: 'Nanakramguda', count: 7 },
      { _id: 'Manikonda', count: 5 }
    ],
    dailyRequests: [
      { _id: '2024-01-20', count: 8 },
      { _id: '2024-01-21', count: 12 },
      { _id: '2024-01-22', count: 6 },
      { _id: '2024-01-23', count: 15 },
      { _id: '2024-01-24', count: 9 }
    ],
    recentProjects: [
      {
        category: 'mason',
        location: 'Kukatpally',
        numberOfWorkers: 3,
        numberOfDays: 5,
        status: 'in-progress'
      },
      {
        category: 'carpenter',
        location: 'Madhapur',
        numberOfWorkers: 2,
        numberOfDays: 10,
        status: 'completed'
      }
    ],
    previousCrew: [
      { name: 'Ravi Kumar', category: 'mason', isAvailable: true },
      { name: 'Suresh Reddy', category: 'helper', isAvailable: false }
    ],
    upcomingJobs: [
      {
        builder: { name: 'Builder 1', companyName: 'Demo Construction' },
        location: 'Kukatpally',
        numberOfDays: 7,
        wagePerDay: 1200,
        status: 'approved'
      }
    ],
    attendanceScore: {
      totalDays: 20,
      presentDays: 18,
      lateDays: 1,
      absentDays: 1
    }
  };

  res.json(mockData);
});

// Mock notifications
app.get('/api/notifications', (req, res) => {
  const mockNotifications = [
    {
      _id: 'notif1',
      title: 'Welcome to Demo Mode',
      message: 'This is a demonstration of the Labor Management Platform',
      isRead: false,
      createdAt: new Date().toISOString(),
      priority: 'high'
    },
    {
      _id: 'notif2',
      title: 'Worker Assigned',
      message: 'Demo worker has been assigned to your project',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      priority: 'medium'
    }
  ];

  res.json({
    notifications: mockNotifications,
    unreadCount: 2,
    pagination: { current: 1, total: 1, hasNext: false, hasPrev: false }
  });
});

// Catch all other API routes
app.use('/api/*', (req, res) => {
  res.status(200).json({ 
    message: 'Demo Mode: This endpoint is not implemented in demo version',
    endpoint: req.originalUrl,
    method: req.method,
    note: 'Install MongoDB and run the full version for complete functionality'
  });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
    
    // Send a welcome notification in demo mode
    setTimeout(() => {
      socket.emit('notification', {
        title: 'Demo Mode Active',
        message: 'Real-time notifications are working! This is a demo message.',
        type: 'info'
      });
    }, 2000);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
🚀 Labor Management Platform - Demo Mode
📡 Server running on http://localhost:${PORT}
🎯 Demo Mode: Limited functionality without database
    
📋 Demo Credentials:
👑 Admin: admin@laborplatform.com / password123
🏗️  Builder: builder1@example.com / password123  
👷 Worker: worker1@example.com / password123

⚠️  Note: This is a demo version. For full functionality:
   1. Install MongoDB
   2. Configure .env file
   3. Run: npm start
   4. Seed database: npm run seed
  `);
});

module.exports = { app, server, io };