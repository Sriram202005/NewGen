const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// File storage config (Multer)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// POST route to handle job application
app.post("/api/apply", upload.single("resume"), async (req, res) => {
  const { name, email, phone, position, linkedin, coverLetter } = req.body;
  const resumeFile = req.file;

  if (!name || !email || !phone || !position) {
    return res.status(400).send("Missing required fields.");
  }

  // Create email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // or smtp.office365.com for Outlook
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email content
  const mailOptions = {
    from: `"Job Application" <${process.env.EMAIL_USER}>`,
    to: process.env.TO_EMAIL,
    subject: `New Application for ${position} - ${name}`,
    html: `
      <h3>New Job Application</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Position:</strong> ${position}</p>
      <p><strong>LinkedIn:</strong> ${linkedin || "N/A"}</p>
      <p><strong>Cover Letter:</strong></p>
      <p>${coverLetter || "No cover letter provided."}</p>
    `,
    attachments: resumeFile
      ? [
          {
            filename: resumeFile.originalname,
            path: resumeFile.path,
          },
        ]
      : [],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Application sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
