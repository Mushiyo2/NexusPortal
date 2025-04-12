async function fetchInternCount() {
    try {
        const response = await fetch('/api/intern/count');
        const data = await response.json();
        document.querySelector('#internUserCount').textContent = data.total;
    } catch (error) {
        console.error('Error fetching intern count:', error);
    }
}
document.addEventListener('DOMContentLoaded', fetchInternCount);

async function fetchCompanyCount() {
    try {
        const response = await fetch('/api/company/count');
        const data = await response.json();
        document.querySelector('#companyUserCount').textContent = data.total;
    } catch (error) {
        console.error('Error fetching company count:', error);
    }
}
document.addEventListener('DOMContentLoaded', fetchCompanyCount);
// Fetch and count intern requests
async function fetchInternRequests() {
    const response = await fetch('/school/intern-requests');
    const requests = await response.json();

    // Update the count of intern requests
    document.querySelector('#internRequestCount').textContent = requests.length;
}
fetchInternRequests();