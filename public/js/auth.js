// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const user = await api.getCurrentUser();
                this.setCurrentUser(user);
                this.showDashboard();
            } catch (error) {
                console.error('Token validation failed:', error);
                this.logout();
            }
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.updateUI();
    }

    updateUI() {
        const userName = document.getElementById('userName');
        const userDropdown = document.getElementById('userDropdown');
        const notificationDropdown = document.getElementById('notificationDropdown');
        const loginBtn = document.getElementById('loginBtn');
        const landingPage = document.getElementById('landingPage');
        const dashboardContent = document.getElementById('dashboardContent');

        if (this.currentUser) {
            // Show authenticated UI
            userName.textContent = this.currentUser.name;
            userDropdown.style.display = 'block';
            notificationDropdown.style.display = 'block';
            loginBtn.style.display = 'none';
            landingPage.style.display = 'none';
            dashboardContent.style.display = 'block';

            // Update navigation based on role
            this.updateNavigation();
            
            // Load notifications
            this.loadNotifications();
        } else {
            // Show unauthenticated UI
            userDropdown.style.display = 'none';
            notificationDropdown.style.display = 'none';
            loginBtn.style.display = 'block';
            landingPage.style.display = 'block';
            dashboardContent.style.display = 'none';
        }
    }

    updateNavigation() {
        const navLinks = document.getElementById('navLinks');
        const role = this.currentUser.role;

        let navigationHTML = '';

        if (role === 'admin') {
            navigationHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showDashboard()">
                        <i class="fas fa-chart-line me-1"></i>Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showPendingApprovals()">
                        <i class="fas fa-user-check me-1"></i>User Approvals
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showPendingRequests()">
                        <i class="fas fa-clipboard-list me-1"></i>Labor Requests
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showWorkersAvailability()">
                        <i class="fas fa-users me-1"></i>Workers
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showProjectTracking()">
                        <i class="fas fa-tasks me-1"></i>Projects
                    </a>
                </li>
            `;
        } else if (role === 'builder') {
            navigationHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showDashboard()">
                        <i class="fas fa-chart-line me-1"></i>Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showCreateRequest()">
                        <i class="fas fa-plus me-1"></i>Request Workers
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showMyRequests()">
                        <i class="fas fa-list me-1"></i>My Requests
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showMyProjects()">
                        <i class="fas fa-tasks me-1"></i>My Projects
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showPreviousCrew()">
                        <i class="fas fa-history me-1"></i>Previous Crew
                    </a>
                </li>
            `;
        } else if (role === 'worker') {
            navigationHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showDashboard()">
                        <i class="fas fa-chart-line me-1"></i>Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showMyJobs()">
                        <i class="fas fa-briefcase me-1"></i>My Jobs
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showEarnings()">
                        <i class="fas fa-coins me-1"></i>Earnings
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showAttendance()">
                        <i class="fas fa-calendar-check me-1"></i>Attendance
                    </a>
                </li>
            `;
        }

        navLinks.innerHTML = navigationHTML;
    }

    async loadNotifications() {
        try {
            const response = await api.getNotifications({ limit: 10 });
            this.updateNotificationBadge(response.unreadCount);
            this.updateNotificationList(response.notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    updateNotificationBadge(unreadCount) {
        const badge = document.getElementById('notificationBadge');
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    updateNotificationList(notifications) {
        const notificationList = document.getElementById('notificationList');
        
        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <li class="dropdown-item text-center text-muted">
                    No notifications
                </li>
            `;
            return;
        }

        let notificationsHTML = '';
        notifications.forEach(notification => {
            const timeAgo = this.getTimeAgo(notification.createdAt);
            const unreadClass = notification.isRead ? '' : 'fw-bold';
            
            notificationsHTML += `
                <li>
                    <a class="dropdown-item notification-item ${unreadClass}" 
                       href="#" onclick="markNotificationAsRead('${notification._id}')">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <div class="fw-semibold">${notification.title}</div>
                                <div class="text-muted small">${notification.message}</div>
                            </div>
                            <small class="text-muted">${timeAgo}</small>
                        </div>
                    </a>
                </li>
            `;
        });

        notificationsHTML += `
            <li><hr class="dropdown-divider"></li>
            <li>
                <a class="dropdown-item text-center" href="#" onclick="markAllNotificationsAsRead()">
                    Mark all as read
                </a>
            </li>
        `;

        notificationList.innerHTML = notificationsHTML;
    }

    getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInMs = now - past;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return formatDate(date);
    }

    showDashboard() {
        if (this.currentUser) {
            dashboardManager.loadDashboard();
        }
    }

    logout() {
        api.removeToken();
        this.currentUser = null;
        this.updateUI();
        // Redirect to home page
        window.location.reload();
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Global functions for UI interactions
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

function toggleRoleFields() {
    const role = document.getElementById('registerRole').value;
    const builderFields = document.getElementById('builderFields');
    const locationFields = document.getElementById('locationFields');
    const categoryField = document.getElementById('categoryField');
    const workerFields = document.getElementById('workerFields');

    // Hide all fields first
    builderFields.style.display = 'none';
    locationFields.style.display = 'none';
    categoryField.style.display = 'none';
    workerFields.style.display = 'none';

    if (role === 'builder') {
        builderFields.style.display = 'block';
    } else if (role === 'supervisor') {
        locationFields.style.display = 'block';
    } else if (role === 'worker') {
        locationFields.style.display = 'block';
        categoryField.style.display = 'block';
        workerFields.style.display = 'block';
    }
}

function showProfile() {
    // TODO: Implement profile modal
    alert('Profile functionality coming soon!');
}

function logout() {
    authManager.logout();
}

async function markNotificationAsRead(notificationId) {
    try {
        await api.markNotificationAsRead(notificationId);
        authManager.loadNotifications();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        await api.markAllNotificationsAsRead();
        authManager.loadNotifications();
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
    }
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        showLoading();
        const response = await api.login({ email, password });
        
        api.setToken(response.token);
        authManager.setCurrentUser(response.user);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('loginForm').reset();
        errorDiv.style.display = 'none';
        
        authManager.showDashboard();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        hideLoading();
    }
});

// Register form handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        phone: document.getElementById('registerPhone').value,
        role: document.getElementById('registerRole').value
    };

    // Add role-specific fields
    if (formData.role === 'builder') {
        formData.companyName = document.getElementById('companyName').value;
    } else if (formData.role === 'supervisor' || formData.role === 'worker') {
        formData.location = document.getElementById('registerLocation').value;
        if (formData.role === 'worker') {
            formData.category = document.getElementById('registerCategory').value;
            formData.experience = parseInt(document.getElementById('registerExperience').value);
        }
    }

    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');

    try {
        showLoading();
        const response = await api.register(formData);
        
        // Show success message
        successDiv.textContent = response.message;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        
        // Clear form
        document.getElementById('registerForm').reset();
        toggleRoleFields(); // Hide role-specific fields
        
        // Auto-login after registration
        if (response.token) {
            api.setToken(response.token);
            authManager.setCurrentUser(response.user);
            
            // Close modal after a short delay
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                modal.hide();
                authManager.showDashboard();
            }, 2000);
        }
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    } finally {
        hideLoading();
    }
});

// Clear form errors when modals are hidden
document.getElementById('loginModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
});

document.getElementById('registerModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('registerForm').reset();
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
    toggleRoleFields();
});