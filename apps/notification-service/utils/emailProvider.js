const SibApiV3Sdk = require('sib-api-v3-sdk');
const nodemailer = require('nodemailer');

const wrapWithVeloraTemplate = (htmlContent) => {
  // If it's already a complete structured email, do not wrap it.
  if (htmlContent.includes('margin: 0 auto;') || htmlContent.includes('Velora')) {
      return htmlContent;
  }

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
      <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 25px;">
              <div style="display: inline-block; padding: 10px 20px; border-radius: 12px; background: #ffffff; position: relative; border: 1px solid #e2e8f0; margin: 0 auto;">
                  <svg width="40" height="40" viewBox="0 0 100 100" style="vertical-align: middle; display: inline-block;">
                      <path d="M15 20 L40 20 L50 80 L25 80 Z" fill="#0b132b" />
                      <path d="M40 20 L50 80 L60 48 Z" fill="#0ea5e9" />
                      <path d="M60 48 L50 80 L85 20 L75 15 Z" fill="#14b8a6" />
                      <path d="M15 20 L40 20 L50 80 L25 80 Z" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.4" />
                      <path d="M40 20 L50 80 L60 48 Z" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.4" />
                      <path d="M60 48 L50 80 L85 20 L75 15 Z" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.4" />
                  </svg>
                  <span style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 1px; color: #0f172a; vertical-align: middle; margin-left: 10px;">VELORA</span>
              </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 20px 0; margin-bottom: 20px; color: #334155; line-height: 1.6;">
              ${htmlContent}
          </div>

          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; margin-bottom: 0;">
              This is an automated message from Velora. Please do not reply.
          </p>
      </div>
  </div>
  `;
};

const sendEmail = async (toEmail, subject, htmlContent) => {
  const formattedHtml = wrapWithVeloraTemplate(htmlContent);

  // 1. If SMTP settings are specified in environment, send via Nodemailer SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
          const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS
              }
          });
          const info = await transporter.sendMail({
              from: `"Velora" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
              to: toEmail,
              subject: subject,
              html: formattedHtml
          });
          console.log(`[Notification-Service] [Nodemailer SMTP] Email dispatched to ${toEmail}: ${info.messageId}`);
          return true;
      } catch (err) {
          console.error(`[Notification-Service] [Nodemailer SMTP] Failed to send email to ${toEmail}:`, err.message);
      }
  }

  // 2. If Brevo API Key is present, try transactional API sending
  const brevoKey = process.env.BREVO_API_KEY;

  if (brevoKey) {
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = brevoKey;

      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = formattedHtml;
      sendSmtpEmail.sender = { "name": "Velora", "email": process.env.SENDER_EMAIL || "no-reply@veloracrm.com" };
      sendSmtpEmail.to = [{ "email": toEmail }];

      try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`[Notification-Service] [Brevo API] Email dispatched to ${toEmail}`);
        return true;
      } catch (error) {
        console.error(`[Notification-Service] [Brevo API] Failed to send email to ${toEmail}:`, error.message);
        if (error.response && error.response.text) {
            console.error('   Brevo Details:', error.response.text);
        }
      }
  }

  // 3. Absolute Fallback: Generate Ethereal SMTP email account for seamless local/demo testing
  try {
      console.log('[Notification-Service] Initializing Ethereal SMTP test account for development fallback...');
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
              user: testAccount.user,
              pass: testAccount.pass
          }
      });
      const info = await transporter.sendMail({
          from: `"Velora" <no-reply@veloracrm.com>`,
          to: toEmail,
          subject: subject,
          html: formattedHtml
      });
      console.log(`[Notification-Service] [Ethereal Fallback] Email dispatched to ${toEmail}: ${info.messageId}`);
      console.log(`[Notification-Service] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      return true;
  } catch (etherealErr) {
      console.error('[Notification-Service] Ethereal fallback failed:', etherealErr.message);
      return false;
  }
};

module.exports = { sendEmail };

