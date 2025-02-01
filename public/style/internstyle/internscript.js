document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/intern-profile', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            const data = await response.json();
            document.querySelector('.username').textContent = data.name;
            document.querySelector('.school-id').textContent = `ID: ${data.school_id}`;
            document.querySelector('.sidebar-menu-item-title-expanded').textContent = `INTERN ID: ${data.id}`;
        } else {
            console.error('Failed to load profile data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});



async function fetchNotifications() {
    try {
        const response = await fetch('/api/notifications'); // Fetch notifications
        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const notifications = await response.json();
        console.log('Fetched Notifications:', notifications); // Debug log

        const notificationContainer = document.querySelector('.dropdown-menu-notification-wrapper');
        notificationContainer.innerHTML = ''; // Clear previous notifications

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

        // Attach delete functionality to buttons
        document.querySelectorAll('.deleteNotification').forEach(button => {
            button.addEventListener('click', async (e) => {
                const notificationId = e.currentTarget.getAttribute('data-id');
                console.log('Deleting notification with ID:', notificationId); // Debug log
                await deleteNotification(notificationId);
            });
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}


async function deleteNotification(notificationId) {
    if (!notificationId || notificationId === 'undefined') {
        console.error('Invalid notification ID:', notificationId);
        alert('Failed to delete notification: Invalid ID.');
        return;
    }

    try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete notification: ${errorText}`);
        }

        alert('Notification deleted successfully!');
        fetchNotifications(); // Refresh the list
        updateNotificationCount(); // Update the count
    } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Failed to delete notification.');
    }
}


async function updateNotificationCount() {
    try {
        const response = await fetch('/api/notifications'); // Fetch notifications
        if (!response.ok) {
            throw new Error('Failed to fetch notifications count');
        }

        const notifications = await response.json();
        const notificationCountElement = document.querySelector('.topbar-button-total-notification');
        notificationCountElement.textContent = notifications.length;
    } catch (error) {
        console.error('Error updating notification count:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchNotifications();
    updateNotificationCount();
});
