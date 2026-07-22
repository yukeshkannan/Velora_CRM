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
              <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; text-align: center; border-radius: 14px; background: linear-gradient(135deg, #0f172a 0%, #0b132b 100%); position: relative; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15); margin: 0 auto;">
                  <svg width="28" height="28" viewBox="0 0 100 100" style="vertical-align: middle;">
                      <polygon points="15,20 45,20 50,75 30,85" fill="#0ea5e9" opacity="0.8"/>
                      <polygon points="45,20 50,75 65,48" fill="#0284c7" opacity="0.95"/>
                      <polygon points="65,48 50,75 85,20 75,15" fill="#14b8a6" opacity="0.9"/>
                  </svg>
              </div>
              <div style="font-family: 'Georgia', serif; font-size: 16px; font-weight: bold; letter-spacing: 3px; color: #0f172a; margin-top: 10px; text-transform: uppercase;">Velora</div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 20px 0; margin-bottom: 20px; color: #334155; line-height: 1.6;">
              ${htmlContent}
          </div>

          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; margin-bottom: 0;">
              This is an automated message from Velora CRM. Please do not reply.
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
  if (process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.includes('not enabled')) {
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = process.env.BREVO_API_KEY;

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

