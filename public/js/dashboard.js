// Dashboard Management
class DashboardManager {
    constructor() {
        this.currentView = 'dashboard';
        this.socket = null;
        this.initializeSocket();
    }

    initializeSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                const user = authManager.currentUser;
                if (user) {
                    this.socket.emit('join', user.id);
                }
            });

            this.socket.on('notification', (notification) => {
                this.handleNewNotification(notification);
            });
        }
    }

    handleNewNotification(notification) {
        // Update notification badge
        authManager.loadNotifications();
        
        // Show toast notification (you can customize this)
        this.showToast(notification.title, notification.message);
    }

    showToast(title, message) {
        // Simple toast notification - you can enhance this
        const toast = document.createElement('div');
        toast.className = 'toast show position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-bell text-primary me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    async loadDashboard() {
        this.currentView = 'dashboard';
        const user = authManager.currentUser;
        
        try {
            showLoading();
            const dashboardData = await api.getDashboardData();
            
            let content = '';
            if (user.role === 'admin') {
                content = this.renderAdminDashboard(dashboardData);
            } else if (user.role === 'builder') {
                content = this.renderBuilderDashboard(dashboardData);
            } else if (user.role === 'worker') {
                content = this.renderWorkerDashboard(dashboardData);
            }
            
            document.getElementById('dashboardContent').innerHTML = content;
        } catch (error) {
            showError('Failed to load dashboard: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    renderAdminDashboard(data) {
        return `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1><i class="fas fa-chart-line me-2"></i>Admin Dashboard</h1>
                    <button class="btn btn-primary" onclick="showWorkersAvailability()">
                        <i class="fas fa-users me-1"></i>View Workers
                    </button>
                </div>

                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.totalUsers || 0}</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.pendingApprovals || 0}</div>
                            <div class="stat-label">Pending Approvals</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.activeProjects || 0}</div>
                            <div class="stat-label">Active Projects</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${formatCurrency(data.totalRevenue || 0)}</div>
                            <div class="stat-label">Monthly Revenue</div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-6 mb-4">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-map-marker-alt me-2"></i>Workers by Location</h5>
                            <div class="mt-3">
                                ${this.renderWorkersByLocation(data.workersByLocation || [])}
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 mb-4">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-chart-bar me-2"></i>Recent Activity</h5>
                            <div class="mt-3">
                                ${this.renderDailyRequests(data.dailyRequests || [])}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="dashboard-card">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5><i class="fas fa-clock me-2"></i>Quick Actions</h5>
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-2">
                                    <button class="btn btn-outline-primary w-100" onclick="showPendingApprovals()">
                                        <i class="fas fa-user-check me-1"></i>User Approvals
                                    </button>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <button class="btn btn-outline-success w-100" onclick="showPendingRequests()">
                                        <i class="fas fa-clipboard-list me-1"></i>Labor Requests
                                    </button>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <button class="btn btn-outline-info w-100" onclick="showProjectTracking()">
                                        <i class="fas fa-tasks me-1"></i>Project Tracking
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderBuilderDashboard(data) {
        return `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1><i class="fas fa-hard-hat me-2"></i>Builder Dashboard</h1>
                    <button class="btn btn-primary" onclick="showCreateRequest()">
                        <i class="fas fa-plus me-1"></i>Request Workers
                    </button>
                </div>

                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.myRequests || 0}</div>
                            <div class="stat-label">Total Requests</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.activeProjects || 0}</div>
                            <div class="stat-label">Active Projects</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.completedProjects || 0}</div>
                            <div class="stat-label">Completed Projects</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${formatCurrency(data.totalSpent || 0)}</div>
                            <div class="stat-label">Total Spent</div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8 mb-4">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-list me-2"></i>Recent Projects</h5>
                            <div class="mt-3">
                                ${this.renderRecentProjects(data.recentProjects || [])}
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-history me-2"></i>Previous Crew</h5>
                            <div class="mt-3">
                                ${this.renderPreviousCrew(data.previousCrew || [])}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-tools me-2"></i>Quick Actions</h5>
                            <div class="row">
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-outline-primary w-100" onclick="showCreateRequest()">
                                        <i class="fas fa-plus me-1"></i>New Request
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-outline-success w-100" onclick="showCreateRequest(true)">
                                        <i class="fas fa-exclamation-triangle me-1"></i>Emergency Request
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-outline-info w-100" onclick="showMyRequests()">
                                        <i class="fas fa-list me-1"></i>My Requests
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-outline-warning w-100" onclick="showPreviousCrew()">
                                        <i class="fas fa-history me-1"></i>Rehire Crew
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderWorkerDashboard(data) {
        return `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1><i class="fas fa-hammer me-2"></i>Worker Dashboard</h1>
                    <div class="badge ${data.isAvailable ? 'bg-success' : 'bg-danger'} fs-6">
                        ${data.isAvailable ? 'Available' : 'Busy'}
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.assignedProjects || 0}</div>
                            <div class="stat-label">Total Jobs</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.activeProjects || 0}</div>
                            <div class="stat-label">Active Jobs</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${data.completedProjects || 0}</div>
                            <div class="stat-label">Completed Jobs</div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="stat-card">
                            <div class="stat-number">${formatCurrency(data.totalEarnings || 0)}</div>
                            <div class="stat-label">Total Earnings</div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-8 mb-4">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-briefcase me-2"></i>Upcoming Jobs</h5>
                            <div class="mt-3">
                                ${this.renderUpcomingJobs(data.upcomingJobs || [])}
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-4">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-chart-pie me-2"></i>Attendance Score</h5>
                            <div class="mt-3">
                                ${this.renderAttendanceScore(data.attendanceScore || {})}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderWorkersByLocation(workers) {
        if (!workers.length) return '<p class="text-muted">No data available</p>';
        
        return workers.map(item => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span><i class="fas fa-map-marker-alt me-1"></i>${item._id}</span>
                <span class="badge bg-primary">${item.count}</span>
            </div>
        `).join('');
    }

    renderDailyRequests(requests) {
        if (!requests.length) return '<p class="text-muted">No recent activity</p>';
        
        return requests.map(item => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${formatDate(item._id)}</span>
                <span class="badge bg-info">${item.count} requests</span>
            </div>
        `).join('');
    }

    renderRecentProjects(projects) {
        if (!projects.length) return '<p class="text-muted">No recent projects</p>';
        
        return projects.slice(0, 5).map(project => `
            <div class="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
                <div>
                    <div class="fw-semibold">${project.category} - ${project.location}</div>
                    <small class="text-muted">${project.numberOfWorkers} workers for ${project.numberOfDays} days</small>
                </div>
                <span class="badge status-badge ${getStatusBadgeClass(project.status)}">${capitalizeFirst(project.status)}</span>
            </div>
        `).join('');
    }

    renderPreviousCrew(crew) {
        if (!crew.length) return '<p class="text-muted">No previous crew</p>';
        
        return crew.slice(0, 5).map(worker => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <div class="fw-semibold">${worker.name}</div>
                    <small class="text-muted">${capitalizeFirst(worker.category)}</small>
                </div>
                <span class="badge ${worker.isAvailable ? 'bg-success' : 'bg-secondary'}">${worker.isAvailable ? 'Available' : 'Busy'}</span>
            </div>
        `).join('');
    }

    renderUpcomingJobs(jobs) {
        if (!jobs.length) return '<p class="text-muted">No upcoming jobs</p>';
        
        return jobs.map(job => `
            <div class="border rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${job.builder.companyName || job.builder.name}</h6>
                    <span class="badge status-badge ${getStatusBadgeClass(job.status)}">${capitalizeFirst(job.status)}</span>
                </div>
                <div class="text-muted small">
                    <i class="fas fa-map-marker-alt me-1"></i>${job.location} | 
                    <i class="fas fa-calendar me-1"></i>${job.numberOfDays} days |
                    <i class="fas fa-coins me-1"></i>${formatCurrency(job.wagePerDay)}/day
                </div>
            </div>
        `).join('');
    }

    renderAttendanceScore(score) {
        const totalDays = score.totalDays || 0;
        const presentDays = score.presentDays || 0;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        return `
            <div class="text-center">
                <div class="display-4 text-primary mb-2">${attendancePercentage}%</div>
                <div class="text-muted mb-3">Attendance Rate</div>
                <div class="row text-center">
                    <div class="col-6">
                        <div class="fw-bold text-success">${presentDays}</div>
                        <small class="text-muted">Present</small>
                    </div>
                    <div class="col-6">
                        <div class="fw-bold text-danger">${score.absentDays || 0}</div>
                        <small class="text-muted">Absent</small>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize dashboard manager
const dashboardManager = new DashboardManager();

// Global navigation functions
function showDashboard() {
    dashboardManager.loadDashboard();
}

// These functions will be implemented in separate files or modules
function showPendingApprovals() {
    // Implementation will be added
    alert('Pending Approvals page - Implementation in progress');
}

function showPendingRequests() {
    // Implementation will be added
    alert('Pending Requests page - Implementation in progress');
}

function showWorkersAvailability() {
    // Implementation will be added
    alert('Workers Availability page - Implementation in progress');
}

function showProjectTracking() {
    // Implementation will be added
    alert('Project Tracking page - Implementation in progress');
}

function showCreateRequest(isEmergency = false) {
    // Implementation will be added
    alert('Create Request form - Implementation in progress');
}

function showMyRequests() {
    // Implementation will be added
    alert('My Requests page - Implementation in progress');
}

function showMyProjects() {
    // Implementation will be added
    alert('My Projects page - Implementation in progress');
}

function showPreviousCrew() {
    // Implementation will be added
    alert('Previous Crew page - Implementation in progress');
}

function showMyJobs() {
    // Implementation will be added
    alert('My Jobs page - Implementation in progress');
}

function showEarnings() {
    // Implementation will be added
    alert('Earnings page - Implementation in progress');
}

function showAttendance() {
    // Implementation will be added
    alert('Attendance page - Implementation in progress');
}