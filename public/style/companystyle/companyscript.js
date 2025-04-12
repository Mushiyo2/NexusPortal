async function fetchCompanyNotifications() {
    try {
        const response = await fetch('/api/company-notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');

        const notifications = await response.json();
        const notificationContainer = document.querySelector('.dropdown-menu-notification-wrapper');
        notificationContainer.innerHTML = '';

        notifications.forEach((notification) => {
            const notificationItem = document.createElement('div');
            notificationItem.classList.add('dropdown-menu-notification-item');
            notificationItem.innerHTML = `
                <span class="dropdown-menu-notification-item-icon success">
                    <i class="ri-check-line"></i>
                </span>
                <div class="dropdown-menu-notification-item-right">
                    <p class="dropdown-menu-notification-item-text">${notification.message}</p>
                    <p class="dropdown-menu-notification-item-time">${new Date(notification.timestamp).toLocaleString()}</p>
                </div>
                <button class="deleteNotification" data-id="${notification.id}" style="background: none; border: none; cursor: pointer;">
                    <i class="ri-delete-bin-line" style="color: red;"></i>
                </button>
            `;

            notificationContainer.appendChild(notificationItem);
        });

        document.querySelectorAll('.deleteNotification').forEach(button => {
            button.addEventListener('click', async (e) => {
                const notificationId = e.currentTarget.getAttribute('data-id');
                await deleteNotification(notificationId);
            });
        });
    } catch (error) {
        console.error('Error fetching company notifications:', error);
    }
}

async function deleteNotification(notificationId) {
    try {
        const response = await fetch(`/api/company-notifications/${notificationId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete notification');
        fetchCompanyNotifications();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', fetchCompanyNotifications);


async function updateNotificationCount() {
    try {
        const response = await fetch('/api/company-notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications count');

        const notifications = await response.json();
        document.querySelector('.topbar-button-total-notification').textContent = notifications.length;
    } catch (error) {
        console.error('Error updating notification count:', error);
    }
}

document.addEventListener('DOMContentLoaded', updateNotificationCount);
