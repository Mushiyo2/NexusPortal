document
  .querySelectorAll("#registerForm, #companyRegisterForm")
  .forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData);

      const endpoint =
        form.id === "registerForm" ? "/register" : "/register-company";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) {
          alert(result.error || "An unexpected error occurred.");
        } else {
          alert(result.message);
          form.reset();
        }
      } catch (error) {
        console.error("Error during registration:", error);
        alert("Failed to connect to the server. Please try again later.");
      }
    });
  });

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", function () {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;

    this.classList.toggle("fa-eye-slash");
  });
}

const handleFormSubmit = async (form) => {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  const response = await fetch(form.action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (response.ok) {
    window.location.href = result.redirect;
  } else {
    document.getElementById("loginMessage").textContent =
      result.error || "Login failed.";
  }
};

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  handleFormSubmit(event.target);
});

document
  .getElementById("fetchSchoolRequests")
  .addEventListener("click", async () => {
    const response = await fetch("/admin/requests");
    const requests = await response.json();

    const requestsList = document.getElementById("requestsList");
    requestsList.innerHTML = "";

    requests.forEach((request) => {
      const li = document.createElement("li");
      li.textContent = `${request.name} (${request.email}) - Status: ${request.status}`;
      requestsList.appendChild(li);
    });
  });

async function fetchSchoolUsers() {
  try {
    const response = await fetch("/api/schools");
    const schoolUsers = await response.json();

    const schoolTableBody = document.getElementById("schoolTableBody");
    schoolTableBody.innerHTML = "";
    schoolUsers.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.address}</td>
                <td><button class="action-btn">View</button></td>
            `;
      schoolTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching school users:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchSchoolUsers);

async function fetchCompanyUsers() {
  try {
    const response = await fetch("/api/company");
    const companyUsers = await response.json();

    const companyTableBody = document.getElementById("companyTableBody");
    companyTableBody.innerHTML = "";
    companyUsers.forEach((user) => {
      const row = document.createElement("tr");
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
    console.error("Error fetching company users:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchCompanyUsers);
