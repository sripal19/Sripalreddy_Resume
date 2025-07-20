// Main Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Labor Management Platform Loaded');
    
    // Initialize application components
    initializeApp();
});

function initializeApp() {
    // Check for existing authentication
    const token = localStorage.getItem('token');
    if (token) {
        // Token exists, validate and load dashboard
        authManager.initializeAuth();
    } else {
        // No token, show landing page
        showLandingPage();
    }

    // Initialize global event listeners
    initializeGlobalEvents();
}

function showLandingPage() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'none';
}

function initializeGlobalEvents() {
    // Add any global event listeners here
    
    // Handle network errors
    window.addEventListener('online', function() {
        console.log('Network connection restored');
        // Optionally show a success message
    });

    window.addEventListener('offline', function() {
        console.log('Network connection lost');
        showError('Network connection lost. Please check your internet connection.');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        showError('An unexpected error occurred. Please try again.');
    });
}

// Utility function to check if user is authenticated
function isAuthenticated() {
    return authManager.currentUser !== null;
}

// Utility function to check user role
function hasRole(role) {
    return isAuthenticated() && authManager.currentUser.role === role;
}

// Global error handling
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', { message, source, lineno, colno, error });
    return false;
};

// Show simple notifications
function showNotification(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 
                      type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Enhanced error display
function showError(message) {
    console.error(message);
    showNotification(message, 'error');
}

// Enhanced success display
function showSuccess(message) {
    console.log(message);
    showNotification(message, 'success');
}

// Loading state management
let loadingCount = 0;

function showLoading() {
    loadingCount++;
    if (loadingCount === 1) {
        document.getElementById('loadingSpinner').style.display = 'block';
    }
}

function hideLoading() {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) {
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

// Confirmation dialog helper
function showConfirmDialog(message, onConfirm, onCancel = null) {
    if (confirm(message)) {
        if (onConfirm) onConfirm();
    } else {
        if (onCancel) onCancel();
    }
}

// Format utilities
function formatPhoneNumber(phone) {
    // Simple phone number formatting for Indian numbers
    if (phone.startsWith('+91')) {
        return phone;
    }
    if (phone.startsWith('91')) {
        return '+' + phone;
    }
    if (phone.length === 10) {
        return '+91-' + phone;
    }
    return phone;
}

function getInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function timeAgo(date) {
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

// Local storage helpers
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to storage:', error);
    }
}

function getFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Failed to get from storage:', error);
        return defaultValue;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to remove from storage:', error);
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Copy to clipboard utility
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => {
            showSuccess('Copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showError('Failed to copy to clipboard');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showSuccess('Copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showError('Failed to copy to clipboard');
        } finally {
            textArea.remove();
        }
    }
}

// Print utility
function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        showError('Element not found for printing');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="css/style.css">
            <style>
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${element.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

// Download JSON data as file
function downloadJSON(data, filename = 'data.json') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Browser feature detection
const features = {
    notifications: 'Notification' in window,
    geolocation: 'geolocation' in navigator,
    localStorage: (() => {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch {
            return false;
        }
    })(),
    socketIO: typeof io !== 'undefined'
};

// Console welcome message
console.log(`
    🏗️ Labor Management Platform
    Version: 1.0.0
    
    Features available:
    - Notifications: ${features.notifications ? '✅' : '❌'}
    - Geolocation: ${features.geolocation ? '✅' : '❌'}
    - Local Storage: ${features.localStorage ? '✅' : '❌'}
    - Real-time Updates: ${features.socketIO ? '✅' : '❌'}
    
    Environment: ${window.location.hostname === 'localhost' ? 'Development' : 'Production'}
`);

// Export utilities for global use
window.LaborPlatform = {
    showNotification,
    showError,
    showSuccess,
    showConfirmDialog,
    formatPhoneNumber,
    getInitials,
    timeAgo,
    copyToClipboard,
    printElement,
    downloadJSON,
    debounce,
    throttle,
    features
};