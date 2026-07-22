const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendOTPEmail = async (email, otp) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = "Password Reset OTP";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; text-align: center; border-radius: 14px; background: linear-gradient(135deg, #0f172a 0%, #0b132b 100%); position: relative; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);">
                    <svg width="28" height="28" viewBox="0 0 100 100" style="vertical-align: middle;">
                        <polygon points="15,20 45,20 50,75 30,85" fill="#0ea5e9" opacity="0.8"/>
                        <polygon points="45,20 50,75 65,48" fill="#0284c7" opacity="0.95"/>
                        <polygon points="65,48 50,75 85,20 75,15" fill="#14b8a6" opacity="0.9"/>
                    </svg>
                </div>
                <div style="font-family: 'Georgia', serif; font-size: 16px; font-weight: bold; letter-spacing: 3px; color: #0f172a; margin-top: 10px; text-transform: uppercase;">Velora</div>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 20px 0; margin-bottom: 20px; color: #334155; line-height: 1.6;">
                <h3 style="color: #1e293b; margin-top: 0;">Password Reset Request</h3>
                <p>Hello,</p>
                <p>We received a request to reset your password. Use the following OTP code to proceed:</p>
                <div style="text-align: center; margin: 25px 0;">
                    <span style="font-family: monospace; font-size: 24px; font-weight: bold; tracking: 4px; color: #0f172a; background-color: #f1f5f9; padding: 10px 24px; border-radius: 8px; border: 1px solid #e2e8f0;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px;">This OTP code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.</p>
            </div>

            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; margin-bottom: 0;">
                This is an automated message from Velora CRM. Please do not reply.
            </p>
        </div>
    </div>
  `;
  // Use the email you verified in Brevo (usually your login email)
  sendSmtpEmail.sender = { "name": "Velora CRM", "email": process.env.SENDER_EMAIL || "no-reply@veloracrm.com" };
  sendSmtpEmail.to = [{ "email": email }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = { sendOTPEmail };
