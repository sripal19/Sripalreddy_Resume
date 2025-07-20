# Labor Management Platform

A comprehensive platform connecting builders with skilled workers across Hyderabad. This platform enables builders to request workers, admins to manage approvals and assignments, and workers to find job opportunities.

## 🌟 Features

### For Builders
- **Worker Requests**: Request skilled workers for construction projects
- **Emergency Requests**: 10% surcharge for urgent worker needs
- **Project Tracking**: Monitor active and completed projects
- **Previous Crew**: Rehire workers from previous successful projects
- **Real-time Notifications**: Get notified when workers are assigned
- **Cost Analytics**: Track spending and project costs

### For Admin
- **User Management**: Approve/reject user registrations
- **Labor Request Management**: Approve/reject labor requests
- **Worker Assignment**: Assign available workers to approved requests
- **Real-time Dashboard**: Monitor platform activity and metrics
- **Workers Availability**: Track worker status across all locations
- **Analytics**: Revenue tracking, worker distribution, and activity reports

### For Workers
- **Job Notifications**: Get notified when assigned to projects
- **Earnings Tracking**: Monitor daily and total earnings
- **Attendance Management**: Track work attendance and hours
- **Rating System**: Build reputation through client ratings
- **Availability Status**: Manage availability for new assignments

### For Supervisors
- **Project Oversight**: Manage and supervise construction projects
- **Location-based Assignments**: Work within designated areas

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT-based authentication with role-based access
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for live notifications
- **API**: RESTful API with comprehensive endpoints
- **Validation**: Express-validator for data validation

### Frontend (Vanilla JavaScript)
- **Modern UI**: Bootstrap 5 with custom CSS
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Socket.io client integration
- **Role-based Views**: Different dashboards for each user type

## 📍 Coverage Areas

The platform currently serves these locations in Hyderabad:
- Kukatpally
- Bachupally  
- Madhapur
- Kondapur
- Financial District
- Nanakramguda
- Manikonda

## 👥 Worker Categories & Wages

| Category | Daily Wage | Icon |
|----------|------------|------|
| Mason | ₹1,200 | 🧱 |
| Helper | ₹800 | 🤝 |
| Carpenter | ₹1,000 | 🔨 |
| Plumber | ₹1,000 | 🔧 |
| Painter | ₹900 | 🎨 |
| Electrician | ₹1,000 | ⚡ |

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd labor-management-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/labor_management
   JWT_SECRET=your_secret_key_here
   ADMIN_EMAIL=admin@laborplatform.com
   ADMIN_PASSWORD=admin123456
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Seed the database** (optional - for demo data)
   ```bash
   npm run seed
   ```

6. **Start the application**
   ```bash
   npm start
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Demo Credentials

After seeding the database, you can use these credentials:

**Admin:**
- Email: `admin@laborplatform.com`
- Password: `admin123456`

**Builder:**
- Email: `builder1@example.com`
- Password: `password123`

**Worker:**
- Email: `worker_kukatpally_mason_1@example.com`
- Password: `password123`

## 📱 Usage Guide

### For Builders

1. **Register/Login**
   - Click "Register" and select "Builder"
   - Provide company details
   - Wait for admin approval

2. **Request Workers**
   - Navigate to "Request Workers"
   - Select location, category, number of workers, and duration
   - Choose if supervisor is needed
   - Mark as emergency if urgent (10% extra charge)
   - Submit request

3. **Track Projects**
   - Monitor request status in "My Requests"
   - View assigned workers in "My Projects"
   - Rate workers after project completion

### For Admin

1. **User Approvals**
   - Review pending user registrations
   - Approve or reject based on verification

2. **Labor Request Management**
   - Review incoming labor requests
   - Approve requests that meet criteria
   - Assign available workers to approved requests

3. **Worker Management**
   - Monitor worker availability
   - Track worker performance and ratings
   - Manage worker assignments

### For Workers

1. **Registration**
   - Register with category, location, and experience
   - Wait for admin approval

2. **Job Management**
   - Receive notifications for new assignments
   - View upcoming jobs in dashboard
   - Track earnings and attendance

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/auth/pending-approvals` - Get pending approvals (Admin)
- `PUT /api/auth/approve/:userId` - Approve user (Admin)

### Labor Requests
- `POST /api/labor-requests` - Create labor request (Builder)
- `GET /api/labor-requests` - Get labor requests
- `GET /api/labor-requests/pending` - Get pending requests (Admin)
- `PUT /api/labor-requests/:id/approve` - Approve request (Admin)
- `POST /api/labor-requests/:id/assign-worker` - Assign worker (Admin)

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/workers-availability` - Get worker availability
- `GET /api/analytics/project-tracking` - Get project tracking data

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/mark-read` - Mark notification as read

## 🗄️ Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  role: ['admin', 'builder', 'supervisor', 'worker'],
  phone: String,
  location: String, // For workers/supervisors
  category: String, // For workers
  experience: Number, // For workers
  rating: Number, // For workers
  isApproved: Boolean,
  isAvailable: Boolean // For workers
}
```

### Labor Requests Collection
```javascript
{
  builder: ObjectId,
  location: String,
  category: String,
  numberOfWorkers: Number,
  numberOfDays: Number,
  wagePerDay: Number,
  totalCost: Number,
  withSupervisor: Boolean,
  isEmergency: Boolean,
  status: ['pending', 'approved', 'rejected', 'in-progress', 'completed'],
  assignedWorkers: [{ worker: ObjectId, assignedAt: Date }],
  workAddress: String,
  description: String
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Role-based Access**: Different access levels for different user types
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Cross-origin request protection

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB (MongoDB Atlas recommended for production)
2. Configure environment variables
3. Set up SSL certificates for HTTPS
4. Configure domain and DNS

### Production Deployment
```bash
# Build for production
npm install --production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "labor-platform"

# Or start directly
NODE_ENV=production npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and queries:
- Email: support@laborplatform.com
- Documentation: [Wiki](https://github.com/your-repo/wiki)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🙏 Acknowledgments

- Bootstrap for the UI framework
- MongoDB for the database solution
- Socket.io for real-time functionality
- Express.js for the web framework
- All contributors and users of the platform

---

**Made with ❤️ for the construction industry in Hyderabad**