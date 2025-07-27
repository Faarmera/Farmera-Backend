// const sgMail = require('@sendgrid/mail');

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// module.exports = sgMail;

const nodemailer = require('nodemailer');
require('dotenv').config();

const emailConfig = {
  smtpServer: process.env.EMAIL_SMTP_SERVER,
  smtpPort: parseInt(process.env.EMAIL_SMTP_PORT, 10),
  username: process.env.EMAIL_USERNAME,
  password: process.env.EMAIL_PASSWORD,
  fromAddress: process.env.EMAIL_FROM_ADDRESS,
};

const transporter = nodemailer.createTransport({
  host: emailConfig.smtpServer,
  port: emailConfig.smtpPort,
  secure: emailConfig.smtpPort === 465, // Use SSL for port 465, STARTTLS for 587
  auth: {
    user: emailConfig.username,
    pass: emailConfig.password,
  },
  requireTLS: emailConfig.smtpPort === 587, // Enforce STARTTLS for port 587
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2', // Ensure modern TLS version
  },
});

module.exports = {emailConfig, transporter};

