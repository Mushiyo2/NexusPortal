const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");
const session = require("express-session");
const { Task } = require("./models/task");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: "uploads",
      allowed_formats: ["jpg", "png", "jpeg", "pdf"],
      public_id: `intern_${Date.now()}`, // <-- FIXED
      resource_type: "auto", // still OK
      type: "upload",
    };
  },
});

// const multer = require('multer');
//const upload = multer({ storage: multer.memoryStorage() }); // or specify a disk storage
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Configure Multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     },
// });
const upload = multer({ storage: storage });
const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
}).array("files", 5); // Allow up to 5 files per request

app.use(cors());

const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_jwt_secret";
// Function to extract user ID from JWT token
function getUserIdFromToken(token) {
  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    throw new Error("Invalid token");
  }
}

// Middleware
app.use(express.json()); // To parse JSON bodies
function authenticateUser(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "nexuslogin.html"));
});
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Middleware to check if the user is approved
const checkApproval = async (req, res, next) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(403).json({ message: "User not logged in." });
  }

  try {
    const user = await pool.query("SELECT is_approved FROM school WHERE id = $1", [userId]);

    if (user.rows.length > 0 && !user.rows[0].is_approved) {
      return res.status(403).json({ message: "Wait for admin approval to enter the website." });
    }

    next(); // Proceed to the next middleware or route handler if approved
  } catch (error) {
    console.error("Error checking approval:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Route to serve signupschool.html

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signupschool.html"));
});
// Route to serve main.html, protected by checkApproval middleware
app.get("/main", checkApproval, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});
//QUERIES
app.use("/chat", express.static(path.join(__dirname, "public/chat/dist")));

// Route for React chat app fallback
app.get("/chat/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/chat/dist/index.html"));
});

app.get("/companyprofileIT.html", (req, res) => {
  if (!req.session.userId || req.session.userType !== "intern") {
    return res.status(401).redirect("/nexuslogin.html"); // Redirect to login if not authorized
  }

  // Pass the internId to the template
  res.sendFile(path.join(__dirname, "public", "companyprofileIT.html"), {
    headers: { "Content-Type": "text/html" },
    internId: req.session.userId, // Use session userId as the internId
  });
});
app.get("/api/session", (req, res) => {
  if (!req.session.userId || req.session.userType !== "intern") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ internId: req.session.userId });
});

app.get("/api/chat-session", (req, res) => {
  console.log("Session API called");
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  res.json({
    userId: req.session.userId,
    nickname: req.session.nickname,
    accessToken: req.session.accessToken || "",
  });
});
// Route to register a new company
app.post("/register-company", async (req, res) => {
  const { email, password, name, address, contact } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO company_requests (email, password, name, address, contact, status) VALUES ($1, $2, $3, $4, $5, $6)";
    await pool.query(query, [email, hashedPassword, name, address, contact, "pending"]);
    res.status(201).json({ message: "Registration successful! Awaiting admin approval." });
  } catch (error) {
    console.error("Error registering company:", error);
    res.status(500).json({ error: "Error registering company." });
  }
});

app.post("/register", async (req, res) => {
  const { email, password, name, address } = req.body;

  console.log("Received data:", req.body); // Debugging line

  if (!email || !password || !name || !address) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO school_requests (email,password, name, address, status) VALUES ($1, $2, $3, $4, $5)",
      [email, hashedPassword, name, address, "pending"]
    );
    res.status(201).json({ message: "Registration successful! Awaiting admin approval." });
  } catch (error) {
    console.error("Error registering school:", error);
    res.status(500).json({ error: "Error registering school." });
  }
});

app.post("/register-intern", upload.single("school_id_image"), async (req, res) => {
  const { email, password, name, address, school_id } = req.body;
  const schoolImage = req.file;

  console.log("Received form data:", req.body);
  console.log("Cloudinary Image:", schoolImage);

  if (!name || !email || !password || !school_id || !schoolImage) {
    return res.status(400).json({
      error: "Name, email, password, school ID, and image are required.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure Cloudinary URL is properly stored
    const imageUrl = schoolImage ? schoolImage.path : null;

    const query = `
            INSERT INTO intern_requests (email, password, name, address, school_id, schoolid_img, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
    await pool.query(query, [
      email,
      hashedPassword,
      name,
      address,
      school_id,
      imageUrl, // Save Cloudinary URL
      "pending",
    ]);

    // Fetch all approved schools
    const schools = await pool.query("SELECT id FROM school WHERE is_approved = true");

    // Insert notifications for all approved schools
    const message = `A new intern request has been submitted by ${name}.`;
    const notificationQueries = schools.rows.map((school) => {
      return pool.query(
        "INSERT INTO school_notifications (school_id, message, timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)",
        [school.id, message]
      );
    });
    await Promise.all(notificationQueries);

    res.status(201).json({ message: "Intern registration successful!", imageUrl });
  } catch (error) {
    console.error("Error registering intern:", error);
    res.status(500).json({ error: "An unexpected error occurred during registration." });
  }
});
// Admin: Approve or reject a request
app.put("/admin/requests/:id", async (req, res) => {
  const { status, type } = req.body; // Expecting { status: 'approved', type: 'school' } or { status: 'rejected', type: 'company' }
  const requestId = req.params.id;

  // Determine which table to use based on request type
  const tableName = type === "school" ? "school_requests" : "company_requests";

  try {
    // Update the request status
    await pool.query(`UPDATE ${tableName} SET status = $1 WHERE id = $2`, [status, requestId]);

    // Fetch request data for further actions
    const requestData = await pool
      .query(`SELECT * FROM ${tableName} WHERE id = $1`, [requestId])
      .then((res) => res.rows[0]);

    if (status === "approved") {
      const existingEntry = await pool.query(`SELECT * FROM ${type} WHERE email = $1`, [requestData.email]);

      if (existingEntry.rows.length > 0) {
        // Update existing entry to set approval status
        await pool.query(`UPDATE ${type} SET is_approved = true WHERE email = $1`, [requestData.email]);
      } else {
        // Insert new entry into the main table with approval status set
        await pool.query(
          `INSERT INTO ${type} (email, password, name, address${
            type === "company" ? ", contact" : ""
          }, is_approved) VALUES ($1, $2, $3, $4${type === "company" ? ", $5" : ""}, true)`,
          type === "company"
            ? [requestData.email, requestData.password, requestData.name, requestData.address, requestData.contact]
            : [requestData.email, requestData.password, requestData.name, requestData.address]
        );
      }
    } else if (status === "rejected") {
      const existingEntry = await pool.query(`SELECT * FROM ${type} WHERE email = $1`, [requestData.email]);
      if (existingEntry.rows.length > 0) {
        await pool.query(`UPDATE ${type} SET is_approved = false WHERE email = $1`, [requestData.email]);
      }
    }

    // Send email notification using nodemailer
    const mailOptions = {
      from: "lenujpagliawan@gmail.com",
      to: requestData.email,
      subject:
        status === "approved"
          ? type === "school"
            ? "School Registration Approved"
            : "Company Registration Approved"
          : type === "school"
          ? "School Registration Rejected"
          : "Company Registration Rejected",
      text:
        status === "approved"
          ? `Dear ${requestData.name},\n\nCongratulations! Your registration for the ${
              type === "school" ? "School" : "Company"
            } Portal has been successfully approved. You now have full access to manage your account and connect with interns.\n\nWe’re excited to have you on board and look forward to your active participation in the program.\n\nBest regards,\nThe Intern Portal Team`
          : `Dear ${requestData.name},\n\nThank you for your interest in joining the ${
              type === "school" ? "School" : "Company"
            } Portal. After careful review, we regret to inform you that your registration has not been approved at this time.\n\nIf you have any questions or believe this decision was made in error, please feel free to reach out for further clarification.\n\nBest regards,\nThe Intern Portal Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(200).json({ message: `Request ${status}.` });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ error: "Error updating request status." });
  }
});
// Import nodemailer
const nodemailer = require("nodemailer");

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// School : Approve or reject intern request
app.put("/school/requests/:id", async (req, res) => {
  const { status } = req.body; // Expecting { status: 'approved' } or { status: 'rejected' }
  const requestId = req.params.id;
  const type = "intern";

  try {
    await pool.query(`UPDATE intern_requests SET status = $1 WHERE id = $2`, [status, requestId]);

    // Fetch request data for further actions
    const requestData = await pool
      .query(`SELECT * FROM intern_requests WHERE id = $1`, [requestId])
      .then((res) => res.rows[0]);

    if (status === "approved") {
      const existingEntry = await pool.query(`SELECT * FROM intern WHERE email = $1`, [requestData.email]);

      if (existingEntry.rows.length > 0) {
        // Update existing entry to set approval status
        await pool.query(`UPDATE intern SET is_approved = true WHERE email = $1`, [requestData.email]);
      } else {
        // Insert new entry into the school table with approval status set
        await pool.query(
          `INSERT INTO intern (email, password, name, address, school_id, is_approved) VALUES ($1, $2, $3, $4, $5, true)`,
          [requestData.email, requestData.password, requestData.name, requestData.address, requestData.school_id]
        );
      }
    } else if (status === "rejected") {
      const existingEntry = await pool.query(`SELECT * FROM intern WHERE email = $1`, [requestData.email]);
      if (existingEntry.rows.length > 0) {
        await pool.query(`UPDATE intern SET is_approved = false WHERE email = $1`, [requestData.email]);
      }
    }

    // Send email notification
    const mailOptions = {
      from: "lenujpagliawan@gmail.com",
      to: requestData.email,
      subject:
        status === "approved" ? "Internship Portal Registration Approved" : "Internship Portal Registration Rejected",
      text:
        status === "approved"
          ? `Dear ${requestData.name},\n\nCongratulations! Your registration for the Intern Portal Nexus has been approved. You now have access to explore opportunities, connect with companies, and manage your internship journey.\n\nWelcome aboard! We look forward to supporting you throughout your internship experience.\n\nBest regards,\nThe Intern Portal Team`
          : `Dear ${requestData.name},\n\nThank you for your interest in joining the Intern Portal Nexus. After careful review, we regret to inform you that your registration has not been approved at this time.\n\nIf you have any questions or believe this was a mistake, please feel free to reach out.\n\nBest regards,\nThe Intern Portal Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(200).json({ message: `Request ${status}.` });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ error: "Error updating request status." });
  }
});

// Update request status
app.put("/admin/requests/:id", async (req, res) => {
  const { id } = req.params;
  const { status, type } = req.body;

  const tableName = type === "school" ? "school_requests" : "company_requests";

  try {
    const result = await pool.query(`UPDATE ${tableName} SET status = $1 WHERE id = $2`, [status, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json({ message: "Request updated successfully" });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch users
app.get("/api/schools", async (req, res) => {
  try {
    const result = await pool.query("SELECT name, email, address FROM school WHERE is_approved = true");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching school users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/company", async (req, res) => {
  try {
    const result = await pool.query("SELECT name, email, address,contact FROM company WHERE is_approved = true");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/intern", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, email, address,department,school_id FROM intern WHERE is_approved = true"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching intern users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch school requests
app.get("/admin/school-requests", async (req, res) => {
  const result = await pool.query("SELECT * FROM school_requests WHERE status = $1", ["pending"]);
  res.json(result.rows);
});
// Fetch company requests
app.get("/admin/company-requests", async (req, res) => {
  const result = await pool.query("SELECT * FROM company_requests WHERE status = $1", ["pending"]);
  res.json(result.rows);
});
// Fetch intern requests
app.get("/school/intern-requests", async (req, res) => {
  const result = await pool.query("SELECT * FROM intern_requests WHERE status = $1", ["pending"]);
  res.json(result.rows);
});

//TOTAL SCHOOL, COMPANY, INTERN COUNT
app.get("/api/schools/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM school");
    res.json({ total: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching school count:", error);
    res.status(500).send("Server Error");
  }
});
app.get("/api/company/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM company");
    res.json({ total: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching company count:", error);
    res.status(500).send("Server Error");
  }
});
app.get("/api/intern/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM intern");
    res.json({ total: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching intern count:", error);
    res.status(500).send("Server Error");
  }
});

app.post("/login", async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    // Determine the query based on userType
    const userQuery =
      userType === "school"
        ? "SELECT * FROM school WHERE email = $1"
        : userType === "company"
        ? "SELECT * FROM company WHERE email = $1"
        : "SELECT * FROM intern WHERE email = $1";

    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    console.log("User authenticated, checking SendBird user...");
    try {
      // Check if the user exists in SendBird
      await axios.get(`https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/users/${user.id}`, {
        headers: {
          "Api-Token": process.env.SENDBIRD_API_TOKEN,
        },
      });
      console.log(`SendBird user already exists for user ID ${user.id}`);
    } catch (sendbirdError) {
      if (sendbirdError.response?.status === 400 || sendbirdError.response?.status === 404) {
        console.log("SendBird user not found, creating user...");
        // Create the user in SendBird
        const createResponse = await axios.post(
          `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3/users`,
          {
            user_id: user.id.toString(),
            nickname: user.name || "User",
            profile_url: user.profile_picture || "", // Optional
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Api-Token": process.env.SENDBIRD_API_TOKEN,
            },
          }
        );

        console.log(`SendBird user created for user ID ${user.id}`);

        // Optional: Update the database with the SendBird ID if needed
        const sendbirdId = createResponse.data.user_id;
        if (userType === "intern") {
          await pool.query("UPDATE intern SET sendbird_id = $1 WHERE id = $2", [sendbirdId, user.id]);
        } else if (userType === "company") {
          await pool.query("UPDATE company SET sendbird_id = $1 WHERE id = $2", [sendbirdId, user.id]);
        }
      } else {
        console.error("Error with SendBird API:", sendbirdError.response?.data || sendbirdError.message);
        return res.status(500).json({ error: "Failed to connect to SendBird." });
      }
    }

    // Set session data
    req.session.userId = user.id;
    req.session.userType = userType;
    req.session.nickname = user.name || "User";
    req.session.accessToken = ""; // Optional if SendBird access tokens are not used

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Session error" });
      }

      const redirectUrl =
        userType === "school"
          ? "/schoolindex.html"
          : userType === "company"
          ? "/companyindex.html"
          : "/internindex.html";

      console.log(`User logged in as ${userType}, ID: ${user.id}, redirecting to ${redirectUrl}`);
      res.json({ redirect: redirectUrl });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// index.js (Logout Route)
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.redirect("/nexuslogin.html");
  });
});

// Fetch current school profile
app.get("/api/school-profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    const result = await pool.query("SELECT * FROM school WHERE id = $1", [req.session.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update school profile
app.put("/api/update-school-profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const { name, contact, address, email, description } = req.body;

  try {
    console.log("Updating profile with data:", {
      name,
      contact,
      address,
      email,
      description,
    });

    const result = await pool.query(
      "UPDATE school SET name = $1, contact = $2, address = $3, email = $4, description = $5 WHERE id = $6 RETURNING *",
      [name, contact, address, email, description, req.session.userId]
    );

    if (result.rowCount === 0) {
      console.log("Profile not found for update");
      return res.status(404).json({ error: "Profile not found" });
    }

    console.log("Profile updated successfully:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch current intern profile
app.get("/api/intern-profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    const result = await pool.query("SELECT * FROM intern WHERE id = $1", [req.session.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Update intern profile
app.put("/api/update-intern-profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  // Destructure the data from the request body
  const { name, school_id, address, email, university, department } = req.body;

  try {
    console.log("Updating profile with data:", {
      name,
      school_id,
      address,
      email,
      university,
      department,
    });

    // Execute the update query on the database
    const result = await pool.query(
      "UPDATE intern SET name = $1, school_id = $2, address = $3, email = $4, university = $5, department = $6 WHERE id = $7 RETURNING *",
      [name, school_id, address, email, university, department, req.session.userId]
    );

    if (result.rowCount === 0) {
      console.log("Profile not found for update");
      return res.status(404).json({ error: "Profile not found" });
    }

    console.log("Profile updated successfully:", result.rows[0]);
    res.json(result.rows[0]); // Send the updated profile data as a response
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/change-password", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const result = await pool.query("SELECT password FROM intern WHERE id = $1", [req.session.userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const storedHashedPassword = result.rows[0].password;
    const isMatch = await bcrypt.compare(currentPassword, storedHashedPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE intern SET password = $1 WHERE id = $2", [hashedNewPassword, req.session.userId]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Fetch current company profile
app.get("/api/company-profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    const result = await pool.query("SELECT * FROM company WHERE id = $1", [req.session.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Update company profile
app.put("/api/update-company-profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authorized" });
  }

  // Destructure the data from the request body
  const { name, contact, address, email, role, department, description, is_available } = req.body;

  try {
    console.log("Updating profile with data:", {
      name,
      contact,
      address,
      email,
      role,
      department,
      description,
      is_available,
    });

    // Execute the update query on the database
    const result = await pool.query(
      "UPDATE company SET name = $1, contact = $2, address = $3, email = $4, role = $5, department = $6, description = $7, is_available=$8 WHERE id = $9 RETURNING *",
      [name, contact, address, email, role, department, description, is_available, req.session.userId]
    );

    if (result.rowCount === 0) {
      console.log("Profile not found for update");
      return res.status(404).json({ error: "Profile not found" });
    }

    console.log("Profile updated successfully:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// NEWS FEED
app.get("/api/posts", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                posts.*,
                school.name AS school_name,
                company.name AS company_name,
                COALESCE(school.email, company.email) AS user_email
            FROM posts
            LEFT JOIN school ON posts.school_id = school.id
            LEFT JOIN company ON posts.company_id = company.id
            ORDER BY created_at DESC
        `);
    res.json({
      posts: result.rows,
      currentUserId: req.session.userId,
      userType: req.session.userType,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).send("Server error");
  }
});

app.post("/api/posts", upload.single("image"), authenticateUser, async (req, res) => {
  const { content } = req.body;
  const userId = req.session.userId; // The ID of the currently logged-in user
  const userType = req.session.userType; // 'school' or 'company'

  let image_url = null;

  // If an image is uploaded, get the Cloudinary secure URL
  if (req.file) {
    image_url = req.file.path; // Cloudinary provides the secure URL in `req.file.path`
  }

  try {
    let query, values;
    if (userType === "school") {
      query = "INSERT INTO posts (content, image_url, school_id) VALUES ($1, $2, $3) RETURNING *";
      values = [content, image_url, userId];
    } else if (userType === "company") {
      query = "INSERT INTO posts (content, image_url, company_id) VALUES ($1, $2, $3) RETURNING *";
      values = [content, image_url, userId];
    } else {
      return res.status(400).json({ error: "Invalid user type" });
    }

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error while posting:", err);
    res.status(500).send("Server error");
  }
});

// index.js
function authenticateUser(req, res, next) {
  if (!req.session.userId) {
    console.log("User not authenticated, no session ID found");
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("User authenticated with session ID:", req.session.userId); // Debugging
  next();
}

// index.js (Delete Post Route)
app.delete("/api/posts/:id", authenticateUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.userId;
  const userType = req.session.userType;

  try {
    // Restrict INTERN users
    if (userType === "intern") {
      return res.status(403).json({ error: "Interns are not allowed to delete posts." });
    }

    // Existing logic: Check post ownership
    const postResult = await pool.query("SELECT school_id, company_id FROM posts WHERE id = $1", [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).send("Post not found");
    }

    const post = postResult.rows[0];
    if (
      (userType === "school" && post.school_id !== userId) ||
      (userType === "company" && post.company_id !== userId)
    ) {
      return res.status(403).send("You do not have permission to delete this post");
    }

    // Delete post
    await pool.query("DELETE FROM posts WHERE id = $1", [postId]);
    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).send("Server error");
  }
});

app.post("/api/company-posts", upload.single("image"), authenticateUser, async (req, res) => {
  const { content } = req.body;
  const companyId = req.session.userId; // Assuming `userId` holds the company ID

  let image_url = null;

  // If an image is uploaded, get the Cloudinary secure URL
  if (req.file) {
    image_url = req.file.path; // Cloudinary provides the secure URL in `req.file.path`
  }

  try {
    const result = await pool.query(
      "INSERT INTO posts (content, image_url, company_id) VALUES ($1, $2, $3) RETURNING *",
      [content, image_url, companyId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/api/company-posts", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT posts.*, company.name AS company_name, company.email AS company_email
            FROM posts
            JOIN company ON posts.company_id = company.id
            ORDER BY created_at DESC
        `);
    res.json({ posts: result.rows, currentUserId: req.session.userId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.delete("/api/posts/:id", authenticateUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.userId;
  const userType = req.session.userType;

  try {
    // Restrict INTERN users
    if (userType === "intern") {
      return res.status(403).json({ error: "Interns are not allowed to delete posts." });
    }

    // Fetch the post to get the image URL
    const postResult = await pool.query("SELECT school_id, company_id, image_url FROM posts WHERE id = $1", [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).send("Post not found");
    }

    const post = postResult.rows[0];
    if (
      (userType === "school" && post.school_id !== userId) ||
      (userType === "company" && post.company_id !== userId)
    ) {
      return res.status(403).send("You do not have permission to delete this post");
    }

    // Delete the image from Cloudinary if it exists
    if (post.image_url) {
      const publicId = post.image_url.split("/").pop().split(".")[0]; // Extract public ID from URL
      await cloudinary.uploader.destroy(`news_feed/${publicId}`);
    }

    // Delete the post from the database
    await pool.query("DELETE FROM posts WHERE id = $1", [postId]);
    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).send("Server error");
  }
});

//INTERN VIEW PROFILE WITHOUT EDIT
app.get("/api/intern-profile/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query("SELECT * FROM intern WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Intern not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching intern profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/company-profile/:email", async (req, res) => {
  let { email } = req.params;
  email = decodeURIComponent(email).toLowerCase();

  try {
    const result = await pool.query("SELECT * FROM company WHERE LOWER(email) = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(result.rows[0]); // Ensure the id is part of this response
  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/school-profile/:email", async (req, res) => {
  let { email } = req.params;
  email = decodeURIComponent(email).toLowerCase();

  try {
    const result = await pool.query("SELECT * FROM school WHERE LOWER(email) = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }
    res.json(result.rows[0]); // Ensure the id is part of this response
  } catch (error) {
    console.error("Error fetching school profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch all tasks for a given intern_id (from session)
app.get("/api/tasks", async (req, res) => {
  const { userId } = req.session; // Using userId instead of intern_id

  if (!userId) {
    return res.status(400).json({ message: "Intern ID is required" });
  }

  try {
    const result = await pool.query("SELECT * FROM task_intern WHERE intern_id = $1", [userId]); // Using userId for the query
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// Create a new task (using intern_id from session)
app.post("/api/tasks", async (req, res) => {
  const { title, description, deadline } = req.body;
  const { userId } = req.session; // Using userId instead of intern_id

  if (!userId) {
    return res.status(400).json({ message: "Intern ID is required" });
  }

  try {
    const query = `
            INSERT INTO task_intern (title, description, deadline, intern_id, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING *;
        `;
    const values = [title, description, deadline, userId]; // Using userId for the query
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
});

// Update task status
app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query("SELECT * FROM task_intern WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updatedTask = await pool.query("UPDATE task_intern SET status = $1 WHERE id = $2 RETURNING *", [status, id]);

    res.json(updatedTask.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM task_intern WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ message: "Failed to delete task", error: err.message });
  }
});

app.get("/api/company-infotech", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT name, email, address, contact, department, role 
            FROM company 
            WHERE is_approved = true 
            AND department = 'Information Technology'
            AND is_available = true 
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/company/countinfotech", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT COUNT(*) 
            FROM company 
            WHERE department = 'Information Technology' AND is_approved = true
        `);
    res.json({ total: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching company count for Information Technology department:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/api/company-industrytech", async (req, res) => {
  try {
    const result = await pool.query(`
             SELECT name, email, address, contact, department, role 
            FROM company 
            WHERE is_approved = true 
            AND department = 'Industrial Technology'
            AND is_available = true 
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/company/countindustrytech", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT COUNT(*) 
            FROM company 
            WHERE department = 'Industrial Technology' AND is_approved = true
        `);
    res.json({ total: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching company count for Industrial Technology department:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/api/company-computerengineer", async (req, res) => {
  try {
    const result = await pool.query(`
             SELECT name, email, address, contact, department, role 
            FROM company 
            WHERE is_approved = true 
            AND department = 'Computer Engineering'
            AND is_available = true 
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/company/countcomputerengineer", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT COUNT(*) 
            FROM company 
            WHERE department = 'Computer Engineering' AND is_approved = true
        `);
    res.json({ total: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching company count for Industrial Technology department:", error);
    res.status(500).send("Server Error");
  }
});
// app.post('/api/company/apply', async (req, res) => {
//     const { company_id } = req.body;

//     // Get intern ID and user type from the session
//     const internId = req.session.userId;
//     const userType = req.session.userType;

//     // Authorization check to ensure only logged-in interns can apply
//     if (!internId || userType !== 'intern') {
//         console.error('Unauthorized application attempt:', { internId, userType });
//         return res.status(401).json({ error: 'Unauthorized: Only logged-in interns can apply' });
//     }

//     try {
//         // Insert the application into the database
//         const result = await pool.query(
//             `INSERT INTO companyinternshiprequests (company_id, intern_id, application_status, applied_at)
//              VALUES ($1, $2, 'Pending', CURRENT_TIMESTAMP)`,
//             [company_id, internId]
//         );

//         console.log(`Intern ${internId} successfully applied to company ${company_id}`);
//         res.json({ success: true });
//     } catch (error) {
//         console.error('Error applying for internship:', error);
//         if (error.code === '23505') { // PostgreSQL unique violation error code
//             return res.status(400).json({ error: 'You have already applied for this internship.' });
//         }

//         res.status(500).json({ error: 'Failed to apply for internship' });
//     }
// });
// Server-side: Filter internship requests by the logged-in company's ID
app.get("/api/company-internship-requests", async (req, res) => {
  const companyId = req.session.userId; // Assume this is set when the company logs in

  if (!companyId || req.session.userType !== "company") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    const result = await pool.query(
      `SELECT 
                i.name AS intern_name, 
                i.email AS intern_email, 
                i.address AS intern_address, 
                i.school_id, 
                cir.id
             FROM companyinternshiprequests cir
             JOIN intern i ON cir.intern_id = i.id
             WHERE cir.company_id = $1 
               AND cir.application_status = 'Pending'
               AND NOT EXISTS (
                   SELECT 1 
                   FROM company_interns ci 
                   WHERE ci.intern_id = i.id
               )`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching internship requests for company:", error);
    res.status(500).json({ error: "Failed to fetch internship requests" });
  }
});
app.get("/api/pending-sip-files", async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) AS count FROM sip_files WHERE status = 'pending'`);

    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error("Error fetching pending SIP files:", error);
    res.status(500).json({ error: "Failed to fetch pending SIP files" });
  }
});
app.delete("/api/remove-user", async (req, res) => {
  const { email, userType } = req.body;

  if (!email || !userType) {
    return res.status(400).json({ error: "Missing email or user type." });
  }

  let tableName;
  switch (userType) {
    case "intern":
      tableName = "intern";
      break;
    case "school":
      tableName = "school";
      break;
    case "company":
      tableName = "company";
      break;
    default:
      return res.status(400).json({ error: "Invalid user type." });
  }

  try {
    // Check if user exists
    const userExists = await pool.query(`SELECT * FROM ${tableName} WHERE email = $1`, [email]);
    if (userExists.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    // Delete user
    await pool.query(`DELETE FROM ${tableName} WHERE email = $1`, [email]);
    res.json({ message: `${userType} removed successfully.` });
  } catch (error) {
    console.error(`Error removing ${userType}:`, error);
    res.status(500).json({ error: `Failed to remove ${userType}.` });
  }
});

// Endpoint to update internship request status
app.put("/api/company-internship-requests/:id", async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  const { application_status } = req.body;

  try {
    await pool.query(
      `UPDATE companyinternshiprequests 
             SET application_status = $1, decision_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
      [application_status, requestId]
    );

    res.json({
      message: `Request ${application_status.toLowerCase()} successfully.`,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ error: "Failed to update request status" });
  }
});

// Endpoint to get approved interns for a company
app.get("/api/company-approved-interns/:companyId", async (req, res) => {
  const companyId = parseInt(req.params.companyId, 10);

  if (isNaN(companyId)) {
    return res.status(400).json({ error: "Invalid company ID" });
  }

  try {
    const result = await pool.query(
      `SELECT i.id, i.name, i.email, i.address, i.university AS school_name
             FROM companyinternshiprequests cir
             JOIN intern i ON cir.intern_id = i.id
             WHERE cir.company_id = $1 AND cir.application_status = 'Accepted'`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching approved interns for company:", error);
    res.status(500).json({ error: "Failed to fetch approved interns" });
  }
});

// API to generate a PDF report of approved interns for a company
app.get("/api/reports/approved-interns/:companyId", async (req, res) => {
  const companyId = parseInt(req.params.companyId, 10);

  if (isNaN(companyId)) {
    return res.status(400).json({ error: "Invalid company ID" });
  }

  try {
    // Fetch company name
    const companyResult = await pool.query(`SELECT name FROM company WHERE id = $1`, [companyId]);

    if (companyResult.rowCount === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const companyName = companyResult.rows[0].name;

    // Fetch approved interns with acceptance date
    const result = await pool.query(
      `SELECT i.id, i.name, i.email, i.university AS school_name, 
                    cir.decision_at 
             FROM companyinternshiprequests cir
             JOIN intern i ON cir.intern_id = i.id
             WHERE cir.company_id = $1 AND cir.application_status = 'Accepted'`,
      [companyId]
    );

    const interns = result.rows;

    if (interns.length === 0) {
      return res.status(404).json({ error: "No approved interns found" });
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Disposition", `attachment; filename="${companyName}_Approved_Interns.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Header Section
    doc.font("Helvetica-Bold").fontSize(18).text(`${companyName}`, { align: "center" });
    doc.fontSize(14).text("Approved Interns Report", { align: "center" }).moveDown(1);
    doc.strokeColor("#000").lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    // Table Header
    doc.fontSize(12).font("Helvetica-Bold");
    doc.fillColor("#333333");
    const headerY = doc.y;
    doc
      .text("Name", 50, headerY, { width: 150, align: "left" })
      .text("Email", 200, headerY, { width: 180, align: "left" })
      .text("School", 380, headerY, { width: 120, align: "left" })
      .text("Accepted On", 500, headerY, { width: 80, align: "left" });
    doc.moveDown(0.5).strokeColor("#666").lineWidth(1).moveTo(50, doc.y).lineTo(570, doc.y).stroke();

    // Table Rows
    doc.font("Helvetica").fontSize(11).fillColor("#000000");
    interns.forEach((intern, index) => {
      const rowY = doc.y + 5;
      const formattedDate = new Date(intern.decision_at).toLocaleDateString(); // Format the date
      doc
        .text(intern.name, 50, rowY, { width: 150, align: "left" })
        .text(intern.email, 200, rowY, { width: 180, align: "left" })
        .text(intern.school_name || "N/A", 380, rowY, {
          width: 120,
          align: "left",
        })
        .text(formattedDate, 500, rowY, { width: 80, align: "left" });
      doc.moveDown(0.5);

      // Add a separator line between rows
      if (index !== interns.length - 1) {
        doc.strokeColor("#ddd").lineWidth(0.5).moveTo(50, doc.y).lineTo(570, doc.y).stroke();
      }
    });

    // Footer Section
    doc.moveDown(2);
    doc.strokeColor("#000").lineWidth(1).moveTo(50, doc.y).lineTo(570, doc.y).stroke();
    doc.fontSize(10).fillColor("#666").text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });

    doc.end();
  } catch (error) {
    console.error("Error generating approved interns report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

app.get("/api/check-session", (req, res) => {
  if (req.session.userId) {
    res.json({
      message: "Session is active",
      userId: req.session.userId,
      userType: req.session.userType,
    });
  } else {
    res.status(401).json({ error: "No active session" });
  }
});
// Notify Company Function
async function notifyCompany(companyId, message) {
  try {
    await pool.query(
      `INSERT INTO company_notifications (company_id, message, timestamp)
             VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [companyId, message]
    );
    console.log("Notification inserted successfully for company:", companyId);
  } catch (error) {
    console.error("Error inserting notification into company_notifications:", error);
  }
}
app.post("/api/intern/upload-files", authenticateUser, upload.array("files"), async (req, res) => {
  const internId = req.session.userId;
  const companyId = req.body.companyId;

  console.log("Intern ID:", internId);
  console.log("Company ID:", companyId);
  console.log("Files received:", req.files);

  if (!internId || !companyId || !req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Missing required data." });
  }

  try {
    // Insert internship request
    await pool.query(
      `INSERT INTO companyinternshiprequests (intern_id, company_id, application_status, applied_at)
         VALUES ($1, $2, 'Pending', CURRENT_TIMESTAMP)`,
      [internId, companyId]
    );

    console.log("Internship request inserted successfully.");

    // Notify company
    await pool.query(
      `INSERT INTO company_notifications (company_id, message)
         VALUES ($1, $2)`,
      [companyId, "A new internship request has been received."]
    );

    console.log("Notification inserted successfully for company:", companyId);

    // Insert each uploaded file
    for (const file of req.files) {
      console.log("Processing file:", file);

      const fileName = file.filename?.split("/").pop(); // clean file name
      const originalName = file.originalname;
      const fileUrl = file.path;

      await pool.query(
        `INSERT INTO uploaded_files (file_name, original_name, intern_id, company_id, file_url)
           VALUES ($1, $2, $3, $4, $5)`,
        [fileName, originalName, internId, companyId, fileUrl]
      );
    }

    res.json({ success: true, message: "Application and files uploaded successfully." });
  } catch (error) {
    console.error("Error processing application and file upload:", error);
    res.status(500).json({ error: "Internal server error during upload." });
  }
});

app.post("/api/intern/upload-sip-file", authenticateUser, upload.single("sipFile"), async (req, res) => {
  try {
    const internId = req.session.userId;
    if (!internId || !req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Get the intern's name
    const internResult = await pool.query("SELECT name FROM intern WHERE id = $1", [internId]);
    if (internResult.rows.length === 0) {
      return res.status(404).json({ error: "Intern not found." });
    }
    const internName = internResult.rows[0].name;

    // Get Cloudinary file URL
    const fileUrl = req.file.path; // Cloudinary auto-generates URL

    // Store Cloudinary file URL in PostgreSQL
    await pool.query(
      `INSERT INTO sip_files (file_name, original_name, intern_id, file_url)
             VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.file.path, req.file.originalname, internId, req.file.path]
    );

    console.log(`SIP file uploaded successfully by ${internName}.`);

    // Notify approved schools
    const schools = await pool.query("SELECT id FROM school WHERE is_approved = true");
    const message = `Intern ${internName} has submitted a new SIP form.`;
    const notificationQueries = schools.rows.map((school) => {
      return pool.query(
        "INSERT INTO school_notifications (school_id, message, timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)",
        [school.id, message]
      );
    });
    await Promise.all(notificationQueries);

    res.json({
      success: true,
      message: `SIP file uploaded successfully by ${internName}.`,
      fileUrl,
    });
  } catch (error) {
    console.error("Error processing SIP file upload:", error);
    res.status(500).json({ error: "Failed to process SIP file upload." });
  }
});

app.delete("/api/intern/cancel-sip-file", authenticateUser, async (req, res) => {
  try {
    const internId = req.session.userId;

    // Check if an SIP file exists
    const fileCheck = await pool.query("SELECT file_name FROM sip_files WHERE intern_id = $1", [internId]);

    if (fileCheck.rows.length === 0) {
      return res.status(404).json({ error: "No SIP file found to cancel." });
    }

    const fileName = fileCheck.rows[0].file_name;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(fileName);

    // Delete from PostgreSQL
    await pool.query("DELETE FROM sip_files WHERE intern_id = $1", [internId]);

    console.log(`SIP file deleted from Cloudinary and database for intern ID: ${internId}`);
    res.json({
      success: true,
      message: "SIP file submission canceled successfully.",
    });
  } catch (error) {
    console.error("Error canceling SIP file:", error);
    res.status(500).json({ error: "Failed to cancel SIP file." });
  }
});

app.get("/api/intern/sip-file-status", authenticateUser, async (req, res) => {
  try {
    const internId = req.session.userId;
    const result = await pool.query("SELECT file_name FROM sip_files WHERE intern_id = $1", [internId]);

    if (result.rows.length > 0) {
      res.json({ exists: true, file_name: result.rows[0].file_name });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error fetching SIP file status:", error);
    res.status(500).json({ error: "Failed to check SIP file status." });
  }
});
app.get("/api/interns-with-sip", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                intern.id, 
                intern.name, 
                intern.email, 
                intern.address, 
                intern.school_id, 
                sip_files.file_name, 
                sip_files.file_url
            FROM intern
            JOIN sip_files ON intern.id = sip_files.intern_id
            WHERE sip_files.status = 'pending'  
            ORDER BY intern.name ASC
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching interns with SIP files:", error);
    res.status(500).json({ error: "Failed to fetch data." });
  }
});

// Define the multer storage configuration
const uploadApprovedSIP = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Store approved SIP files in a separate folder
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique file names
    },
  }),
}).single("sipFile");

// Backend: Add this new endpoint for rejection
app.post("/api/reject-sip-file", async (req, res) => {
  try {
    const { internId, internEmail } = req.body;

    if (!internId || !internEmail) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Delete from sip_files
    await pool.query("DELETE FROM sip_files WHERE intern_id = $1", [internId]);

    // Send rejection email
    const mailOptions = {
      from: "your-email@gmail.com",
      to: internEmail,
      subject: "SIP Validation Rejected",
      text: `Dear Intern,\n\nWe regret to inform you that your SIP (Student Internship Program) validation has been rejected. This may be due to missing or incorrect information in your submission.\n\nTo proceed, please review your SIP file and consult your school for further guidance on the necessary corrections or requirements.\n\nIf you need any assistance, feel free to reach out to your school’s internship coordinator.\n\nBest regards,\nSamar State University`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending rejection email:", error);
        return res.status(500).json({ error: "Failed to send email." });
      }
      console.log("Rejection email sent:", info.response);
      res.json({ success: true, message: "SIP rejected and intern notified." });
    });
  } catch (error) {
    console.error("Error rejecting SIP:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update the existing approve endpoint
app.post("/api/approve-sip-file", uploadApprovedSIP, async (req, res) => {
  try {
    const { internId, internEmail } = req.body;
    const file = req.file;

    if (!internId || !internEmail || !file) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Update status in sip_files
    await pool.query("UPDATE sip_files SET status = $1 WHERE intern_id = $2", ["approved", internId]);

    // Store approved file (if you still need this table)
    await pool.query(
      `INSERT INTO approved_sip_files (intern_id, school_id, file_name, original_name) 
            VALUES ($1, $2, $3, $4)`,
      [internId, req.session.userId, file.filename, file.originalname]
    );

    // Send approval email
    const mailOptions = {
      from: "your-email@gmail.com",
      to: internEmail,
      subject: "Approved SIP Form",
      text: `Dear Intern,\n\nYour SIP form has been approved by the school. Please find the attached updated document.\n\nBest regards,\nYour School`,
      attachments: [
        {
          filename: file.originalname,
          path: `uploads/${file.filename}`,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Failed to send email." });
      }
      res.json({
        success: true,
        message: "SIP file approved and sent to intern.",
      });
    });
  } catch (error) {
    console.error("Error processing SIP approval:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
// Route: Fetch Company Notifications
app.get("/api/company-notifications", authenticateUser, async (req, res) => {
  const companyId = req.session.userId;

  if (!companyId || req.session.userType !== "company") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    console.log("Fetching notifications for company ID:", companyId);

    const result = await pool.query(
      `SELECT id, message, timestamp
             FROM company_notifications
             WHERE company_id = $1
             ORDER BY timestamp DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// Route: Delete a Company Notification
app.delete("/api/company-notifications/:id", authenticateUser, async (req, res) => {
  const notificationId = parseInt(req.params.id, 10);

  if (!req.session.userId || req.session.userType !== "company") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    const result = await pool.query(`DELETE FROM company_notifications WHERE id = $1`, [notificationId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    console.log("Notification deleted successfully:", notificationId);
    res.json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});
// Fetch School Notifications
app.get("/api/school-notifications", authenticateUser, async (req, res) => {
  const schoolId = req.session.userId;

  if (!schoolId || req.session.userType !== "school") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    const result = await pool.query(
      `SELECT id, message, timestamp
             FROM school_notifications
             WHERE school_id = $1
             ORDER BY timestamp DESC`,
      [schoolId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching school notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// Route to delete a school notification
app.delete("/api/school-notifications/:id", authenticateUser, async (req, res) => {
  const notificationId = parseInt(req.params.id, 10);
  const schoolId = req.session.userId;

  if (!schoolId || req.session.userType !== "school") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    const result = await pool.query("DELETE FROM school_notifications WHERE id = $1 AND school_id = $2", [
      notificationId,
      schoolId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

app.get("/api/company-internship-status/:companyId", authenticateUser, async (req, res) => {
  const internId = req.session.userId;
  const { companyId } = req.params;

  if (!internId || req.session.userType !== "intern") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      `SELECT id, application_status 
             FROM companyinternshiprequests 
             WHERE intern_id = $1 AND company_id = $2 
             ORDER BY applied_at DESC LIMIT 1`,
      [internId, companyId]
    );

    if (result.rows.length > 0) {
      const { id, application_status } = result.rows[0];
      const canReapply = application_status === "Rejected"; // Allow reapplication if status is "Rejected"
      res.json({
        applied: application_status !== "Rejected", // Consider "Rejected" as not actively applied
        applicationId: id,
        applicationStatus: application_status,
        canReapply,
      });
    } else {
      res.json({ applied: false, canReapply: true }); // No previous application, can apply
    }
  } catch (error) {
    console.error("Error checking application status:", error);
    res.status(500).json({ error: "Failed to check application status." });
  }
});

app.delete("/api/intern/cancel-application/:applicationId", authenticateUser, async (req, res) => {
  const internId = req.session.userId;
  const { applicationId } = req.params;

  if (!internId || req.session.userType !== "intern") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch the application details to delete associated files
    const applicationResult = await pool.query(
      `SELECT * FROM companyinternshiprequests WHERE id = $1 AND intern_id = $2`,
      [applicationId, internId]
    );

    if (applicationResult.rowCount === 0) {
      return res.status(404).json({ error: "Application not found or not authorized." });
    }

    const { company_id } = applicationResult.rows[0];

    // Delete associated files from uploaded_files
    await pool.query(`DELETE FROM uploaded_files WHERE intern_id = $1 AND company_id = $2`, [internId, company_id]);

    // Delete the application from companyinternshiprequests
    await pool.query(`DELETE FROM companyinternshiprequests WHERE id = $1 AND intern_id = $2`, [
      applicationId,
      internId,
    ]);

    res.json({
      success: true,
      message: "Application and associated files deleted successfully.",
    });
  } catch (error) {
    console.error("Error cancelling application:", error);
    res.status(500).json({ error: "Failed to cancel application." });
  }
});

const PDFDocument = require("pdfkit");
const moment = require("moment");

app.get("/api/tasks/report/pdf", async (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    return res.status(400).json({ message: "Intern ID is required" });
  }

  try {
    // Fetch intern and tasks
    const result = await pool.query(
      `SELECT 
        i.id AS intern_id,
        i.name AS intern_name,
        t.id AS task_id,
        t.title,
        t.description,
        t.deadline,
        t.status
      FROM task_intern t
      JOIN intern i ON t.intern_id = i.id
      WHERE i.id = $1;`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No tasks found for this intern" });
    }

    const internName = result.rows[0].intern_name;
    const internId = result.rows[0].intern_id;

    // Create a PDF document
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Disposition", `attachment; filename=task_report_${internId}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res); // Send the PDF as response

    // Add Logo
    doc.image("logo.jpg", 50, 30, { width: 80 });

    // Add Report Title (Centered)
    doc
      .fillColor("#007BFF")
      .font("Helvetica-Bold") // Professional font for headers
      .fontSize(22)
      .text("Intern Task Report", 0, 40, { align: "center" }) // Perfectly centered
      .moveDown(2);

    // Add Intern Info
    doc
      .fillColor("black")
      .font("Times-Bold") // More professional font
      .fontSize(14)
      .text(`Intern Name: ${internName}`, 50, 120)
      .text(`Intern ID: ${internId}`, 50, 140)
      .moveDown(1);

    // Table Headers
    const startX = 50;
    const colWidths = [70, 200, 120, 100]; // Column widths
    let y = doc.y;

    doc
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("Task ID", startX, y, { width: colWidths[0], align: "left" })
      .text("Title", startX + colWidths[0], y, {
        width: colWidths[1],
        align: "left",
      })
      .text("Status", startX + colWidths[0] + colWidths[1], y, {
        width: colWidths[2],
        align: "left",
      })
      .text("Deadline", startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], align: "left" });

    doc
      .moveTo(startX, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke(); // Line separator
    doc.moveDown(1);

    // Table Rows
    y = doc.y;
    result.rows.forEach((task, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc
          .rect(startX, y - 2, 500, 20)
          .fill("#F0F0F0")
          .stroke();
      }

      // Reset text color after background fill
      doc.fillColor("black").font("Times-Roman"); // Professional font for table content

      // Properly aligned text
      doc.text(task.task_id.toString(), startX, y, {
        width: colWidths[0],
        align: "left",
      });
      doc.text(task.title, startX + colWidths[0], y, {
        width: colWidths[1],
        align: "left",
      });
      doc.text(task.status, startX + colWidths[0] + colWidths[1], y, {
        width: colWidths[2],
        align: "left",
      });
      doc.text(moment(task.deadline).format("YYYY-MM-DD"), startX + colWidths[0] + colWidths[1] + colWidths[2], y, {
        width: colWidths[3],
        align: "left",
      });

      y = doc.y + 5; // Add consistent spacing between rows
    });

    doc.end();
  } catch (err) {
    console.error("Error generating PDF report:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/reports/pdf", async (req, res) => {
  try {
    const result = await pool.query("SELECT name, email, address FROM school WHERE is_approved = true");
    const schools = result.rows;

    // Create a PDF document
    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", 'attachment; filename="school-report.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);
    doc.fontSize(18).text("Approved Schools Report", { align: "center" });
    doc.moveDown();

    // Add school data
    schools.forEach((school, index) => {
      doc.fontSize(12).text(`${index + 1}. ${school.name}`);
      doc.text(`   Email: ${school.email}`);
      doc.text(`   Address: ${school.address}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

const ExcelJS = require("exceljs");
//school user report
app.get("/api/reports/excel", async (req, res) => {
  try {
    // 1. Retrieve Data from Database
    const result = await pool.query("SELECT name, email, address, created_at FROM school WHERE is_approved = true");
    const schools = result.rows;

    // 2. Create a New Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Approved Schools");

    // 3. Add Title Row (Row 1)
    worksheet.mergeCells("A1:D1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value = "Intern Portal Nexus - Approved Schools";
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4CAF50" }, // Green background
    };
    worksheet.getRow(1).height = 25;

    // 4. Add Description Row (Row 2)
    worksheet.mergeCells("A2:D2");
    const descriptionRow = worksheet.getCell("A2");
    descriptionRow.value = "Generated Report - List of Approved Schools";
    descriptionRow.font = { italic: true, size: 12 };
    descriptionRow.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    // 5. Define Columns & Create Explicit Header Row (Row 3)
    const columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Address", key: "address", width: 30 },
      { header: "Date Created", key: "created_at", width: 20 },
    ];
    // Assigning the columns sets the keys and widths
    worksheet.columns = columns;

    // Manually create the header row for the data (Row 3)
    const headerRow = worksheet.getRow(3);
    headerRow.values = columns.map((col) => col.header);
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
    };
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
    headerRow.height = 20;

    // 6. Add Data Rows (Starting from Row 4)
    schools.forEach((school, index) => {
      const dataRow = worksheet.addRow(school);
      // Apply alternating row colors for readability
      const fillColor = index % 2 === 0 ? "FFFAFAFA" : "FFFFFFFF";
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fillColor },
        };
      });
    });

    // 7. Add Borders to All Cells for a polished look
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // 8. Set the Response Headers for a Downloadable Excel File
    res.setHeader("Content-Disposition", 'attachment; filename="school-report.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // 9. Write the Workbook to the Response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

app.get("/api/reportsintern/excel", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, email, address, department, school_id, created_at FROM intern WHERE is_approved = true"
    );
    const interns = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Approved Interns");

    // Header title (Row 1)
    worksheet.mergeCells("A1:F1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value = "Intern Portal Nexus - Approved Interns";
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4CAF50" },
    };
    worksheet.getRow(1).height = 25;

    // Description row (Row 2)
    worksheet.mergeCells("A2:F2");
    const descriptionRow = worksheet.getCell("A2");
    descriptionRow.value = "Generated Report - List of Approved Interns";
    descriptionRow.font = { italic: true, size: 12 };
    descriptionRow.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    // Define columns
    const columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Address", key: "address", width: 30 },
      { header: "Department", key: "department", width: 30 },
      { header: "School ID", key: "school_id", width: 15 },
      { header: "Date Created", key: "created_at", width: 20 },
    ];
    worksheet.columns = columns;

    // Create header row explicitly (Row 3)
    const headerRow = worksheet.getRow(3);
    headerRow.values = columns.map((col) => col.header);
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
    };
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
    headerRow.height = 20;

    // Add data rows (starting from Row 4)
    interns.forEach((intern, index) => {
      const row = worksheet.addRow(intern);
      const fillColor = index % 2 === 0 ? "FFFAFAFA" : "FFFFFFFF";
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fillColor },
        };
      });
    });

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    res.setHeader("Content-Disposition", 'attachment; filename="intern-report.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate report." });
  }
});
app.get("/api/reportscompany/excel", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, email, address, department, created_at FROM company WHERE is_approved = true"
    );
    const companies = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Approved Companies");

    // Header title (Row 1)
    worksheet.mergeCells("A1:E1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value = "Intern Portal Nexus - Approved Companies";
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4CAF50" },
    };
    worksheet.getRow(1).height = 25;

    // Description row (Row 2)
    worksheet.mergeCells("A2:E2");
    const descriptionRow = worksheet.getCell("A2");
    descriptionRow.value = "Generated Report - List of Approved Companies";
    descriptionRow.font = { italic: true, size: 12 };
    descriptionRow.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    // Define columns
    const columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Address", key: "address", width: 30 },
      { header: "Department", key: "department", width: 30 },
      { header: "Date Created", key: "created_at", width: 30 },
    ];
    worksheet.columns = columns;

    // Create header row explicitly (Row 3)
    const headerRow = worksheet.getRow(3);
    headerRow.values = columns.map((col) => col.header);
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" },
      },
      alignment: { horizontal: "center", vertical: "middle" },
    };
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
    headerRow.height = 20;

    // Add data rows (starting from Row 4)
    companies.forEach((company, index) => {
      const row = worksheet.addRow(company);
      const fillColor = index % 2 === 0 ? "FFFAFAFA" : "FFFFFFFF";
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fillColor },
        };
      });
    });

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    res.setHeader("Content-Disposition", 'attachment; filename="company-report.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

app.get("/api/intern-uploads/:email", authenticateUser, async (req, res) => {
  const email = req.params.email;
  const companyId = req.session.userId;

  if (!companyId || req.session.userType !== "company") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    // Fetch intern_id based on the email
    const internResult = await pool.query("SELECT id FROM intern WHERE email = $1", [email]);

    if (internResult.rows.length === 0) {
      return res.status(404).json({ error: "Intern not found" });
    }

    const internId = internResult.rows[0].id;

    // Fetch uploaded files for the intern and restrict by company_id
    const filesResult = await pool.query(
      "SELECT file_url, original_name, uploaded_at FROM uploaded_files WHERE intern_id = $1 AND company_id = $2",
      [internId, companyId]
    );

    if (filesResult.rows.length === 0) {
      return res.status(404).json({ error: "No files uploaded for your company" });
    }

    res.json(filesResult.rows);
  } catch (error) {
    console.error("Error fetching uploaded files:", error);
    res.status(500).json({ error: "Failed to fetch uploaded files" });
  }
});

app.put("/api/company-internship-requests/:id/accept", async (req, res) => {
  const requestId = parseInt(req.params.id, 10);

  if (isNaN(requestId)) {
    return res.status(400).json({ error: "Invalid request ID" });
  }

  try {
    // Retrieve request details with intern's email and name
    const requestResult = await pool.query(
      `SELECT 
                cir.company_id, 
                cir.intern_id, 
                i.email, 
                i.name 
             FROM companyinternshiprequests cir
             INNER JOIN intern i ON cir.intern_id = i.id
             WHERE cir.id = $1`,
      [requestId]
    );

    if (requestResult.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const { company_id, intern_id, email, name } = requestResult.rows[0];

    // Fetch the company name
    const companyResult = await pool.query(`SELECT name FROM company WHERE id = $1`, [company_id]);

    if (companyResult.rowCount === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const companyName = companyResult.rows[0].name;

    // Update request status
    await pool.query(
      `UPDATE companyinternshiprequests
             SET application_status = 'Accepted', decision_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
      [requestId]
    );

    // Add intern to company_interns table
    await pool.query(
      `INSERT INTO company_interns (company_id, intern_id, joined_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (company_id, intern_id) DO NOTHING`,
      [company_id, intern_id]
    );

    // Insert notification for the intern
    const notificationMessage = `${companyName} has accepted your internship application.`;
    await pool.query(
      `INSERT INTO notifications (user_id, message)
             VALUES ($1, $2)`,
      [intern_id, notificationMessage]
    );

    // Send email notification to the intern
    const mailOptions = {
      from: "lenujpagliawan@gmail.com",
      to: email,
      subject: "Internship Application Accepted",
      text: `Dear ${name},\n\nCongratulations! ${companyName} has accepted your internship application. Welcome aboard!\n\nBest regards,\nThe Intern Portal Nexus Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.json({
      message: "Internship request accepted, notification sent, and email delivered.",
    });
  } catch (error) {
    console.error("Error accepting internship request:", error);
    res.status(500).json({ error: "Failed to accept internship request." });
  }
});

app.delete("/api/company-internship-requests/:id/reject", async (req, res) => {
  const requestId = parseInt(req.params.id, 10);

  if (isNaN(requestId)) {
    return res.status(400).json({ error: "Invalid request ID" });
  }

  try {
    // Retrieve intern's email and name for the rejected request
    const requestResult = await pool.query(
      `SELECT 
                i.email, 
                i.name 
             FROM companyinternshiprequests cir
             INNER JOIN intern i ON cir.intern_id = i.id
             WHERE cir.id = $1`,
      [requestId]
    );

    if (requestResult.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const { email, name } = requestResult.rows[0];

    // Delete the application request from the database
    await pool.query(
      `DELETE FROM companyinternshiprequests
             WHERE id = $1`,
      [requestId]
    );

    // Send rejection email notification to the intern
    const mailOptions = {
      from: "lenujpagliawan@gmail.com",
      to: email,
      subject: "Internship Application Status – Rejected",
      text: `Dear ${name},\n\nWe appreciate your interest in the internship opportunity. After careful review, we regret to inform you that your application has not been approved and will no longer be considered for this position.\n\nWe encourage you to continue exploring other internship opportunities through the Intern Portal Nexus. If you have any questions or need further assistance, please don't hesitate to reach out.\n\nWishing you success in your future endeavors.\n\nBest regards,\nThe Intern Portal Nexus Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Rejection email sent:", info.response);
      }
    });

    res.json({
      message: "Internship request rejected and deleted, email sent successfully.",
    });
  } catch (error) {
    console.error("Error rejecting and deleting internship request:", error);
    res.status(500).json({ error: "Failed to reject and delete internship request." });
  }
});

app.get("/api/company-assignment-status/:internId/:companyId", async (req, res) => {
  const internId = parseInt(req.params.internId, 10);
  const companyId = parseInt(req.params.companyId, 10);

  if (isNaN(internId) || isNaN(companyId)) {
    return res.status(400).json({ error: "Invalid intern or company ID" });
  }

  try {
    const result = await pool.query(
      `SELECT 1 
             FROM company_interns 
             WHERE intern_id = $1 AND company_id = $2`,
      [internId, companyId]
    );

    res.json({ assigned: result.rowCount > 0 });
  } catch (error) {
    console.error("Error checking assignment status:", error);
    res.status(500).json({ error: "Failed to check assignment status." });
  }
});

app.get("/api/notifications", authenticateUser, async (req, res) => {
  const internId = req.session.userId;

  try {
    const result = await pool.query(
      `SELECT id, message, timestamp
             FROM notifications
             WHERE user_id = $1
             ORDER BY timestamp DESC`,
      [internId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

app.delete("/api/notifications/:id", async (req, res) => {
  const notificationId = parseInt(req.params.id, 10);

  if (isNaN(notificationId)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    const result = await pool.query("DELETE FROM notifications WHERE id = $1", [notificationId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});
app.delete("/api/company-dismiss-intern/:internId", async (req, res) => {
  const internId = parseInt(req.params.internId, 10);
  const companyId = req.session.userId; // Get company ID from session

  if (!companyId || req.session.userType !== "company") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!internId || isNaN(internId)) {
    return res.status(400).json({ error: "Invalid intern ID" });
  }

  try {
    // Retrieve the intern's details and the company's name
    const internResult = await pool.query(
      `SELECT i.email, i.name 
             FROM intern i
             WHERE i.id = $1`,
      [internId]
    );

    const companyResult = await pool.query(
      `SELECT name 
             FROM company 
             WHERE id = $1`,
      [companyId]
    );

    if (internResult.rowCount === 0 || companyResult.rowCount === 0) {
      return res.status(404).json({ error: "Intern or company not found." });
    }

    const { email, name } = internResult.rows[0];
    const companyName = companyResult.rows[0].name;

    // Delete associated files in `uploaded_files`
    await pool.query(`DELETE FROM uploaded_files WHERE intern_id = $1 AND company_id = $2`, [internId, companyId]);

    // Delete internship request in `companyinternshiprequests`
    await pool.query(`DELETE FROM companyinternshiprequests WHERE intern_id = $1 AND company_id = $2`, [
      internId,
      companyId,
    ]);

    // Remove the intern from `company_interns`
    const deleteResult = await pool.query(`DELETE FROM company_interns WHERE intern_id = $1 AND company_id = $2`, [
      internId,
      companyId,
    ]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({
        error: "Intern not found or not associated with the company.",
      });
    }

    // Send email notification to the intern
    const mailOptions = {
      from: "lenujpagliawan@gmail.com", // Replace with your email
      to: email,
      subject: "Internship Completion Notification",
      text: `Dear ${name},\n\nWe would like to inform you that your internship at ${companyName} has officially concluded. We appreciate your dedication and the contributions you have made during your time with the company.\n\nIf you have any questions or require further details regarding your internship completion, please feel free to reach out to ${companyName} directly.\n\nThank you for your hard work, and we wish you success in your future endeavors.\n\nBest regards,\n${companyName}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Removal email sent:", info.response);
      }
    });

    // Insert an in-system notification for the intern
    const notificationMessage = `You have been removed from your internship at ${companyName}.`;
    await pool.query(
      `INSERT INTO notifications (user_id, message, timestamp)
             VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [internId, notificationMessage]
    );

    res.json({
      success: true,
      message: "Intern removed successfully, notified via email and in-system.",
    });
  } catch (error) {
    console.error("Error removing intern:", error);
    res.status(500).json({ error: "Failed to remove intern." });
  }
});

app.get("/api/intern/company", async (req, res) => {
  const internId = req.session.userId;

  if (!internId || req.session.userType !== "intern") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      `SELECT c.name AS company_name, c.department
             FROM companyinternshiprequests cir
             JOIN company c ON cir.company_id = c.id
             WHERE cir.intern_id = $1 AND cir.application_status = 'Accepted'`,
      [internId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No company assigned to the intern." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching company for intern:", error);
    res.status(500).json({ error: "Failed to fetch company information." });
  }
});
app.delete("/api/intern/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const deleteResult = await pool.query("DELETE FROM intern WHERE email = $1", [email]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "User removed successfully." });
  } catch (error) {
    console.error("Error removing user:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
