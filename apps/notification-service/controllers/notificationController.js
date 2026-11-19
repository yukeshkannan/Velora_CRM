const { sendEmail } = require('../utils/emailProvider');

// @desc    Send Generic Email
// @route   POST /api/notifications/email
// @access  Public
exports.sendNotification = async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Please provide to, subject, and message' });
  }

  const htmlContent = String(message).trim().startsWith('<') ? message : `<p>${message}</p>`;
  const result = await sendEmail(to, subject, htmlContent);

  if (result) {
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
};
