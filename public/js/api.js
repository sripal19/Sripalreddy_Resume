// API Base URL
const API_BASE_URL = '/api';

// API Client Class
class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Remove authentication token
    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        return this.request(url.pathname + url.search, {
            method: 'GET'
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Authentication endpoints
    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async getPendingApprovals() {
        return this.get('/auth/pending-approvals');
    }

    async approveUser(userId) {
        return this.put(`/auth/approve/${userId}`);
    }

    async rejectUser(userId) {
        return this.delete(`/auth/reject/${userId}`);
    }

    // Labor request endpoints
    async createLaborRequest(requestData) {
        return this.post('/labor-requests', requestData);
    }

    async getLaborRequests(params = {}) {
        return this.get('/labor-requests', params);
    }

    async getLaborRequest(id) {
        return this.get(`/labor-requests/${id}`);
    }

    async getPendingRequests() {
        return this.get('/labor-requests/pending');
    }

    async approveLaborRequest(id) {
        return this.put(`/labor-requests/${id}/approve`);
    }

    async rejectLaborRequest(id, reason) {
        return this.put(`/labor-requests/${id}/reject`, { reason });
    }

    async getAvailableWorkers(requestId) {
        return this.get(`/labor-requests/${requestId}/available-workers`);
    }

    async assignWorker(requestId, workerId) {
        return this.post(`/labor-requests/${requestId}/assign-worker`, { workerId });
    }

    async completeLaborRequest(id, ratings) {
        return this.put(`/labor-requests/${id}/complete`, { workerRatings: ratings });
    }

    // Notification endpoints
    async getNotifications(params = {}) {
        return this.get('/notifications', params);
    }

    async markNotificationAsRead(id) {
        return this.put(`/notifications/${id}/mark-read`);
    }

    async markAllNotificationsAsRead() {
        return this.put('/notifications/mark-all-read');
    }

    async deleteNotification(id) {
        return this.delete(`/notifications/${id}`);
    }

    async getUnreadCount() {
        return this.get('/notifications/unread-count');
    }

    // Analytics endpoints
    async getDashboardData() {
        return this.get('/analytics/dashboard');
    }

    async getWorkersAvailability(params = {}) {
        return this.get('/analytics/workers-availability', params);
    }

    async getProjectTracking() {
        return this.get('/analytics/project-tracking');
    }

    async getAttendanceData(params = {}) {
        return this.get('/analytics/attendance', params);
    }

    async getCostBreakdown(params = {}) {
        return this.get('/analytics/cost-breakdown', params);
    }

    // Health check
    async healthCheck() {
        return this.get('/health');
    }
}

// Create global API instance
const api = new APIClient();

// Utility functions
const showError = (message) => {
    console.error(message);
    // You can customize this to show toast notifications or modal alerts
    alert(message);
};

const showSuccess = (message) => {
    console.log(message);
    // You can customize this to show toast notifications
    // For now, we'll use a simple approach
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
};

const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const getStatusBadgeClass = (status) => {
    const statusClasses = {
        pending: 'status-pending',
        approved: 'status-approved',
        rejected: 'status-rejected',
        'in-progress': 'status-in-progress',
        completed: 'status-completed'
    };
    return statusClasses[status] || 'status-pending';
};

const getCategoryIcon = (category) => {
    const categoryIcons = {
        mason: 'fas fa-trowel-bricks',
        helper: 'fas fa-hands-helping',
        carpenter: 'fas fa-hammer',
        plumber: 'fas fa-wrench',
        painter: 'fas fa-paint-roller',
        electrician: 'fas fa-bolt'
    };
    return categoryIcons[category] || 'fas fa-user-hard-hat';
};

const getWageRate = (category) => {
    const wageRates = {
        mason: 1200,
        helper: 800,
        carpenter: 1000,
        plumber: 1000,
        painter: 900,
        electrician: 1000
    };
    return wageRates[category] || 0;
};

// Loading state management
const showLoading = () => {
    document.getElementById('loadingSpinner').style.display = 'block';
};

const hideLoading = () => {
    document.getElementById('loadingSpinner').style.display = 'none';
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, showError, showSuccess, formatCurrency, formatDate, formatDateTime };
}