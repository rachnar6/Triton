const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
});

async function sendTaskNotificationEmail(toEmail, subject, text) {
  try {
    await transporter.sendMail({
      from: '"NeighborCare Community" <no-reply@neighborcare.org>',
      to: toEmail,
      subject,
      text,
    });
    console.log(`Notification email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email notification failed:', err);
  }
}

module.exports = { sendTaskNotificationEmail };