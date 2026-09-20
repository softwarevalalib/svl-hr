const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    console.log(`[email:skipped] to=${to} subject=${subject}`);
    return { skipped: true };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@svlhrm.local';
  const info = await tx.sendMail({ from, to, subject, text, html });
  return { skipped: false, messageId: info.messageId };
}

function createNotification(db, { user_id, title, message, type, link }) {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO Notifications (user_id, title, message, type, link, status)
       VALUES (?, ?, ?, ?, ?, 'Unread')`,
      [user_id, title, message || null, type || 'info', link || null],
      function (err) {
        resolve({ id: this?.lastID, error: err?.message });
      }
    );
  });
}

async function notifyUser(db, { user_id, title, message, type, link, email }) {
  await createNotification(db, { user_id, title, message, type, link });
  if (email) {
    try {
      await sendEmail({ to: email, subject: title, text: message, html: `<p>${message}</p>` });
    } catch (e) {
      console.error('Email send failed:', e.message);
    }
  }
}

module.exports = { sendEmail, createNotification, notifyUser, getTransporter };
