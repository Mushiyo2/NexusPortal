// Common function for form submissions (used for login)
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
document.getElementById('loginForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleFormSubmit(event.target);
});
