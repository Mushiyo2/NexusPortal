
document.getElementById('internRegisterForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    // Debugging: Log all form values
    for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]); 
    }

    try {
        const response = await fetch('/register-intern', {
            method: 'POST',
            body: formData 
        });

        const result = await response.json();
        if (!response.ok) {
            alert(result.error); // Show error message
        } else {
            alert(result.message);
            location.reload();
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        alert('An unexpected error occurred. Please try again later.');
    }
});




const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

if (passwordInput && togglePassword) {
    togglePassword.addEventListener('click', function() {
        // Toggle password visibility
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;

        // Toggle the eye icon class to indicate visibility
        this.classList.toggle('fa-eye-slash');
    });
}

// Common function for form submissions
const handleFormSubmit = async (form) => {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (response.ok) {
        window.location.href = result.redirect;
    } else {
        document.getElementById('loginMessage').textContent = result.error || 'Login failed.';
    }
};

// Attach event listener to the login form
document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    handleFormSubmit(event.target);
});





// Fetch pending school requests
document.getElementById('fetchSchoolRequests').addEventListener('click', async () => {
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


// Fetch school users and display them in the table
async function fetchSchoolUsers() {
    try {
        const response = await fetch('/api/schools');
        const schoolUsers = await response.json();

        const schoolTableBody = document.getElementById('schoolTableBody');
        schoolTableBody.innerHTML = ''; // Clear existing rows

        schoolUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.address}</td>
                <td><button class="action-btn">View</button></td>
            `;
            schoolTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching school users:', error);
    }
}

// Call the function to fetch school users when the page loads
document.addEventListener('DOMContentLoaded', fetchSchoolUsers);


async function fetchCompanyUsers() {
    try {
        const response = await fetch('/api/company');
        const companyUsers = await response.json();

        const companyTableBody = document.getElementById('companyTableBody');
        companyTableBody.innerHTML = ''; // Clear existing rows

        companyUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.address}</td>
                 <td>${user.contact}</td>
                <td><button class="action-btn">View</button></td>
            `;
            companyTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching company users:', error);
    }
}

// Call the function to fetch school users when the page loads
document.addEventListener('DOMContentLoaded', fetchCompanyUsers);