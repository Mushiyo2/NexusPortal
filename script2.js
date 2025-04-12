// Register a new school
document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    alert(result.message);
});

// Login a school
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
        // If login is successful, redirect the user to the main page
        window.location.href = '/main'; // Redirect to the protected main page
    } else {
        // Display error message (e.g., 'Invalid email or password')
        document.getElementById('loginMessage').textContent = result.error;
    }
});


// Fetch pending requests
document.getElementById('fetchRequests').addEventListener('click', async () => {
    const response = await fetch('/admin/requests');
    const requests = await response.json();

    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';

    requests.forEach(request => {
        const li = document.createElement('li');
        li.textContent = `${request.name} (${request.email}) - Status: ${request.status}`;
        requestsList.appendChild(li);
    });
});

document.getElementById('fetchRequests').addEventListener('click', async () => {
    const response = await fetch('/admin/schooltotal');
    const requests = await response.json();

    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';

    requests.forEach(request => {
        const li = document.createElement('li');
        li.textContent = `${request.name} (${request.email}) - Status: ${request.status}`;
        requestsList.appendChild(li);
    });
});