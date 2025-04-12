document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/school-profile', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            const data = await response.json();
            document.querySelector('.username').textContent = data.name;
        } else {
            console.error('Failed to load profile data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
async function fetchSchoolNotifications() {
    try {
        const response = await fetch('/api/school-notifications');
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
                await deleteSchoolNotification(notificationId);
            });
        });
    } catch (error) {
        console.error('Error fetching school notifications:', error);
    }
}

async function deleteSchoolNotification(notificationId) {
    try {
        const response = await fetch(`/api/school-notifications/${notificationId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete notification');
        fetchSchoolNotifications();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', fetchSchoolNotifications);

async function updateNotificationCount() {
    try {
        const response = await fetch('/api/school-notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications count');

        const notifications = await response.json();
        document.querySelector('.topbar-button-total-notification').textContent = notifications.length;
    } catch (error) {
        console.error('Error updating notification count:', error);
    }
}

document.addEventListener('DOMContentLoaded', updateNotificationCount);
