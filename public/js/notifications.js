// Notifications Management
class NotificationManager {
    constructor() {
        this.notifications = [];
    }

    // Add a new notification
    add(notification) {
        this.notifications.unshift(notification);
        this.updateDisplay();
    }

    // Mark notification as read
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.isRead = true;
            this.updateDisplay();
        }
    }

    // Get unread count
    getUnreadCount() {
        return this.notifications.filter(n => !n.isRead).length;
    }

    // Update display
    updateDisplay() {
        // Update badge
        const badge = document.getElementById('notificationBadge');
        const unreadCount = this.getUnreadCount();
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }
}

// Global notification manager instance
const notificationManager = new NotificationManager();