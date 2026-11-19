const SibApiV3Sdk = require('sib-api-v3-sdk');
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    // Loaded lazily on demand
}
const path = require('path');
const PDFDocument = require('pdfkit');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const generatePayslipPDF = (name, month, year, netSalary, baseSalary, presentDays, totalDays, payPerDay) => {
    console.log("[HR Service] Generating Professional Executive Payslip PDF for:", name);
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData.toString('base64'));
            });

            // Page dimensions: 595.28 x 841.89 (A4)
            // Top Header Bar (Dark Slate #0f172a)
            doc.rect(0, 0, 595.28, 105).fill('#0f172a');

            // Draw Geometric Brand Logo Vector Mark
            doc.path('M 40 22 L 62 22 L 72 78 L 50 78 Z').fill('#0b409c');
            doc.path('M 62 22 L 72 78 L 82 48 Z').fill('#0ea5e9');
            doc.path('M 82 48 L 72 78 L 102 22 L 94 18 Z').fill('#14b8a6');

            // Header Branding Text (White)
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff').text('VELORA CRM', 118, 30);
            doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('HUMAN RESOURCES & PAYROLL MANAGEMENT SYSTEM', 118, 55);

            // Right-aligned Payslip title
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff').text('SALARY PAYSLIP', 400, 30, { align: 'right', width: 155 });
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#2dd4bf').text(`${month.toUpperCase()} ${year}`, 400, 54, { align: 'right', width: 155 });

            // Accent Bar (#14b8a6)
            doc.rect(0, 105, 595.28, 4).fill('#14b8a6');

            // Employee & Pay Period Details Box (Card #f8fafc with #cbd5e1 border)
            const boxY = 125;
            doc.roundedRect(40, boxY, 515.28, 85, 8).fillAndStroke('#f8fafc', '#cbd5e1');

            // Left Column
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('EMPLOYEE NAME', 60, boxY + 14);
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text(name, 60, boxY + 26);

            doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('PAY STATEMENT PERIOD', 60, boxY + 48);
            doc.fontSize(10).font('Helvetica').fillColor('#1e293b').text(`${month} ${year}`, 60, boxY + 60);

            // Right Column
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('ATTENDANCE RATIO', 330, boxY + 14);
            doc.fontSize(10).font('Helvetica').fillColor('#1e293b').text(`${presentDays} / ${totalDays} Days Present`, 330, boxY + 26);

            doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('PAYMENT STATUS', 330, boxY + 48);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#15803d').text('PAID & DISBURSED', 330, boxY + 60);

            // Compensation Breakdown Table
            const tableY = 235;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('COMPENSATION BREAKDOWN', 40, tableY);

            // Table Header Bar (#0f172a)
            const thY = tableY + 16;
            doc.rect(40, thY, 515.28, 24).fill('#0f172a');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff').text('EARNINGS COMPONENT', 55, thY + 7);
            doc.text('CALCULATION DETAILS', 240, thY + 7);
            doc.text('AMOUNT (INR)', 440, thY + 7, { align: 'right', width: 100 });

            // Table Rows
            let rowY = thY + 24;
            const drawRowItem = (desc, metric, amountStr, isAlt = false) => {
                if (isAlt) doc.rect(40, rowY, 515.28, 26).fill('#f8fafc');
                doc.moveTo(40, rowY + 26).lineTo(555.28, rowY + 26).stroke('#e2e8f0');

                doc.fontSize(9).font('Helvetica').fillColor('#1e293b').text(desc, 55, rowY + 7);
                doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(metric, 240, rowY + 7);
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(amountStr, 440, rowY + 7, { align: 'right', width: 100 });
                rowY += 26;
            };

            drawRowItem('Base Salary Package', 'Fixed Monthly Agreement', `₹${Number(baseSalary).toLocaleString()}`, false);
            drawRowItem('Attendance Earned', `${presentDays} Days Present / ${totalDays} Total`, `₹${Math.round(presentDays * payPerDay).toLocaleString()}`, true);
            drawRowItem('Pay Rate Per Business Day', 'Daily Evaluated Rate', `₹${parseInt(payPerDay).toLocaleString()}/day`, false);

            // Net Payable Card Banner (#0f172a dark slate box with #34d399 emerald text)
            const netCardY = rowY + 25;
            doc.roundedRect(40, netCardY, 515.28, 60, 8).fill('#0f172a');

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#94a3b8').text('TOTAL NET SALARY DISBURSED', 60, netCardY + 14);
            doc.fontSize(8).font('Helvetica').fillColor('#cbd5e1').text('Direct Bank Account Transfer / Electronic Credit', 60, netCardY + 32);

            doc.fontSize(22).font('Helvetica-Bold').fillColor('#34d399').text(`₹${Number(netSalary).toLocaleString()}`, 350, netCardY + 18, { align: 'right', width: 185 });

            // Signatures Section
            const sigY = netCardY + 110;
            doc.moveTo(60, sigY).lineTo(220, sigY).stroke('#cbd5e1');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('AUTHORIZED HR SIGNATURE', 60, sigY + 6);
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Velora People Operations', 60, sigY + 18);

            doc.moveTo(375, sigY).lineTo(535, sigY).stroke('#cbd5e1');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('EMPLOYEE RECEIPT ACKNOWLEDGEMENT', 375, sigY + 6);
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(name, 375, sigY + 18);

            // Bottom Footer Watermark
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('This document is electronically generated by Velora CRM Human Resource Management System.', 40, 780, { align: 'center', width: 515.28 });
            doc.text('Confidential — For Internal Employee Reference Only', 40, 792, { align: 'center', width: 515.28 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

const sendPayslipEmail = async (email, name, month, year, netSalary, baseSalary, presentDays, totalDays, payPerDay) => {
    // Generate PDF
    let pdfBase64;
    try {
        pdfBase64 = await generatePayslipPDF(name, month, year, netSalary, baseSalary, presentDays, totalDays, payPerDay);
    } catch (pdfErr) {
        console.error("Error generating PDF:", pdfErr);
    }

    // HTML Email Template
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f5f9; border-radius: 20px;">
        <div style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 30px; text-align: center; position: relative;">
                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 12px;">
                    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                        <path d="M15 20 L40 20 L50 80 L25 80 Z" fill="url(#emailLogoLeft)" />
                        <path d="M40 20 L50 80 L60 48 Z" fill="url(#emailLogoCenter)" />
                        <path d="M60 48 L50 80 L85 20 L75 15 Z" fill="url(#emailLogoRight)" />
                        <defs>
                            <linearGradient id="emailLogoLeft" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#0F172A" />
                                <stop offset="50%" stop-color="#0B409C" />
                                <stop offset="100%" stop-color="#14b8a6" />
                            </linearGradient>
                            <linearGradient id="emailLogoCenter" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#0ea5e9" />
                                <stop offset="100%" stop-color="#0284c7" />
                            </linearGradient>
                            <linearGradient id="emailLogoRight" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#2dd4bf" />
                                <stop offset="100%" stop-color="#0ea5e9" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">VELORA CRM</div>
                <div style="color: #94a3b8; font-size: 11px; font-weight: 600; margin-top: 4px; letter-spacing: 1px;">PEOPLE OPERATIONS & PAYROLL</div>
            </div>

            <!-- Title Section -->
            <div style="padding: 30px 30px 10px 30px; text-align: center;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 50px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                    ● SALARY DISBURSED
                </span>
                <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-top: 14px; margin-bottom: 6px;">Payslip Statement</h2>
                <p style="color: #64748b; font-size: 14px; margin: 0;">Statement period: <b>${month} ${year}</b></p>
            </div>

            <!-- Content Body -->
            <div style="padding: 20px 30px 30px 30px;">
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                    Hello <b>${name}</b>,<br/>
                    Your monthly salary for <b>${month} ${year}</b> has been processed successfully. Please review the details below and find your formal PDF payslip attached to this message.
                </p>

                <!-- Table Breakdown Card -->
                <div style="border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: #0f172a; color: #ffffff;">
                                <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase;">Component</th>
                                <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: right;">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
                                <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 500;">Working Days</td>
                                <td style="padding: 14px 16px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right;">${presentDays} / ${totalDays} Days</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                                <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 500;">Pay Rate Per Day</td>
                                <td style="padding: 14px 16px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right;">₹${parseInt(payPerDay).toLocaleString()} / day</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
                                <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 500;">Base Package</td>
                                <td style="padding: 14px 16px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right;">₹${Number(baseSalary).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Net Pay Highlight Card -->
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 22px; border-radius: 14px; text-align: center; color: #ffffff; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
                    <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Total Net Salary Credited</div>
                    <div style="color: #34d399; font-size: 30px; font-weight: 800; letter-spacing: -0.5px;">₹${Number(netSalary).toLocaleString()}</div>
                    <div style="color: #cbd5e1; font-size: 12px; margin-top: 6px;">PDF Payslip Document Attached Below</div>
                </div>

                <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 25px; margin-bottom: 0;">
                    This is an automated system dispatch from Velora CRM. Confidential & Subject to HR Policy.
                </p>
            </div>
        </div>
    </div>
  `;

    // 1. Try Brevo API if Key exists
    const brevoKey = process.env.BREVO_API_KEY;

    if (brevoKey) {
        try {
            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = brevoKey;

            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = `Payslip Generated - ${month} ${year}`;
            sendSmtpEmail.htmlContent = htmlContent;
            sendSmtpEmail.sender = { "name": "Velora CRM", "email": process.env.SENDER_EMAIL || "no-reply@companycrm.com" };
            sendSmtpEmail.to = [{ "email": email, "name": name }];

            if (pdfBase64) {
                sendSmtpEmail.attachment = [{ content: pdfBase64, name: `Payslip_${month}_${year}.pdf` }];
            }

            const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`[HR Service] [Brevo API] Payslip email sent successfully to ${email}`);
            return true;
        } catch (brevoErr) {
            console.error('[HR Service] Brevo API Email error:', brevoErr.message);
            if (brevoErr.response && brevoErr.response.text) {
                console.error('  Brevo Response:', brevoErr.response.text);
            }
        }
    }

    // 2. Fallback: Ethereal Test Account
    try {
        if (!nodemailer) {
            nodemailer = require('nodemailer');
        }
        console.log('[HR Service] Initializing Ethereal SMTP test account fallback for payslip delivery...');
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
        });

        const attachments = [];
        if (pdfBase64) {
            attachments.push({
                filename: `Payslip_${month}_${year}.pdf`,
                content: Buffer.from(pdfBase64, 'base64'),
                contentType: 'application/pdf'
            });
        }

        const info = await transporter.sendMail({
            from: `"Velora CRM" <${process.env.SENDER_EMAIL || 'no-reply@veloracrm.com'}>`,
            to: email,
            subject: `Payslip Generated - ${month} ${year}`,
            html: htmlContent,
            attachments
        });

        console.log(`[HR Service] [Ethereal Fallback] Payslip email sent to ${email}: ${info.messageId}`);
        console.log(`[HR Service] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        return true;
    } catch (etherealErr) {
        console.error('[HR Service] Ethereal fallback failed:', etherealErr.message);
        return false;
    }
};

// Generic email dispatcher via Brevo API with Ethereal/Nodemailer fallback
const dispatchEmail = async ({ to, toName, subject, htmlContent, attachments = [] }) => {
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
        try {
            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = brevoKey;

            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = htmlContent;
            sendSmtpEmail.sender = {
                name: "Velora CRM",
                email: process.env.SENDER_EMAIL || "yukesh785.in@gmail.com"
            };
            sendSmtpEmail.to = [{ email: to, name: toName || to }];
            if (attachments.length > 0) {
                sendSmtpEmail.attachment = attachments;
            }

            await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`[HR Service] [Brevo API] Email dispatched successfully to ${to} (${subject})`);
            return true;
        } catch (brevoErr) {
            console.error('[HR Service] Brevo API Email error:', brevoErr.message);
            if (brevoErr.response && brevoErr.response.text) {
                console.error('  Brevo Response:', brevoErr.response.text);
            }
        }
    }

    // Fallback: Nodemailer
    try {
        if (!nodemailer) nodemailer = require('nodemailer');
        console.log('[HR Service] Initializing SMTP/Ethereal fallback for:', to);
        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });
        } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass }
            });
        }

        const mailAttachments = attachments.map(a => ({
            filename: a.name,
            content: Buffer.from(a.content, 'base64'),
            contentType: 'application/pdf'
        }));

        const info = await transporter.sendMail({
            from: `"Velora CRM" <${process.env.SENDER_EMAIL || 'no-reply@veloracrm.com'}>`,
            to,
            subject,
            html: htmlContent,
            attachments: mailAttachments
        });

        console.log(`[HR Service] [Fallback SMTP] Sent email to ${to}: ${info.messageId}`);
        if (nodemailer.getTestMessageUrl(info)) {
            console.log(`[HR Service] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return true;
    } catch (fallbackErr) {
        console.error('[HR Service] Fallback email delivery failed:', fallbackErr.message);
        return false;
    }
};

const sendLeaveApplicationEmail = async ({
    adminEmail,
    employeeName,
    employeeEmail,
    leaveType,
    startDate,
    endDate,
    durationType,
    halfDaySession,
    shortLeaveHours,
    reason
}) => {
    const formattedStart = new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const formattedEnd = endDate ? new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : formattedStart;
    
    let durationDisplay = durationType || 'Full Day';
    if (durationType === 'Half Day') {
        durationDisplay = `Half Day (${halfDaySession || 'Morning'})`;
    } else if (durationType === 'Short Leave') {
        durationDisplay = `Short Leave (${shortLeaveHours || '2 Hours'})`;
    } else if (formattedStart !== formattedEnd) {
        durationDisplay = `${formattedStart} to ${formattedEnd}`;
    }

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;">
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
            <!-- Header Bar -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 26px 32px; color: #ffffff;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; margin-bottom: 4px;">Velora CRM • Workforce Management</div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">New Leave Request Submitted</h2>
            </div>

            <!-- Body -->
            <div style="padding: 28px 32px; color: #334155;">
                <p style="font-size: 14px; margin-top: 0; margin-bottom: 20px; line-height: 1.6;">
                    Hello Admin,<br/>
                    A new leave / PTO application has been submitted by <strong>${employeeName}</strong> and requires your review.
                </p>

                <!-- Status Banner -->
                <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px;">
                    <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #92400e;">● Status: Pending Admin Review</span>
                </div>

                <!-- Details Table -->
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px; font-size: 13px;">
                    <tbody>
                        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b; width: 38%;">Employee</td>
                            <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${employeeName} (${employeeEmail || 'No email'})</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b;">Leave Type</td>
                            <td style="padding: 12px 16px; font-weight: 700; color: #0369a1;">${leaveType || 'Casual Leave'}</td>
                        </tr>
                        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b;">Duration</td>
                            <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${durationDisplay}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b;">Dates</td>
                            <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${formattedStart}${formattedStart !== formattedEnd ? ' to ' + formattedEnd : ''}</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b; vertical-align: top;">Reason</td>
                            <td style="padding: 12px 16px; font-style: italic; color: #334155; line-height: 1.5;">"${reason || 'No reason specified'}"</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Action Button -->
                <div style="text-align: center; margin: 30px 0 10px 0;">
                    <a href="https://velora-crm-entreprise.vercel.app/attendance" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none;">
                        Review & Approve in CRM →
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                This automated notification was generated by Velora CRM Workforce Engine.
            </div>
        </div>
    </div>
    `;

    return dispatchEmail({
        to: adminEmail,
        toName: "Velora Administrator",
        subject: `📅 New Leave Request: ${employeeName} - ${leaveType}`,
        htmlContent
    });
};

const sendLeaveDecisionEmail = async ({
    employeeEmail,
    employeeName,
    leaveType,
    startDate,
    endDate,
    durationType,
    status,
    adminComment
}) => {
    const isApproved = status === 'Approved';
    const accentColor = isApproved ? '#059669' : '#e11d48';
    const bgLight = isApproved ? '#ecfdf5' : '#fff1f2';
    const borderLight = isApproved ? '#a7f3d0' : '#fecdd3';
    const formattedStart = new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const formattedEnd = endDate ? new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : formattedStart;

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;">
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
            <!-- Header Bar -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 26px 32px; color: #ffffff;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; margin-bottom: 4px;">Velora CRM • Workforce Management</div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">Leave Request ${status}</h2>
            </div>

            <!-- Body -->
            <div style="padding: 28px 32px; color: #334155;">
                <p style="font-size: 14px; margin-top: 0; margin-bottom: 20px; line-height: 1.6;">
                    Hello <strong>${employeeName}</strong>,<br/>
                    Your leave application has been reviewed by the HR / Management team. Here is the decision:
                </p>

                <!-- Decision Badge Box -->
                <div style="background-color: ${bgLight}; border: 1px solid ${borderLight}; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 4px;">Application Status</div>
                    <div style="font-size: 24px; font-weight: 900; color: ${accentColor}; letter-spacing: -0.5px;">${status.toUpperCase()}</div>
                </div>

                <!-- Details Table -->
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px; font-size: 13px;">
                    <tbody>
                        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b; width: 38%;">Leave Type</td>
                            <td style="padding: 12px 16px; font-weight: 700; color: #0f172a;">${leaveType || 'Leave'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b;">Schedule</td>
                            <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${formattedStart}${formattedStart !== formattedEnd ? ' to ' + formattedEnd : ''}</td>
                        </tr>
                        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b;">Duration Type</td>
                            <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${durationType || 'Full Day'}</td>
                        </tr>
                        ${adminComment ? `
                        <tr>
                            <td style="padding: 12px 16px; font-weight: 700; color: #64748b; vertical-align: top;">Management Remarks</td>
                            <td style="padding: 12px 16px; font-style: italic; color: #0f172a; line-height: 1.5;">"${adminComment}"</td>
                        </tr>` : ''}
                    </tbody>
                </table>

                ${isApproved ? `
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #166534; line-height: 1.5;">
                    💡 <strong>Note:</strong> Your attendance registry for these dates has been updated automatically so that salary calculations remain accurate and complete.
                </div>
                ` : `
                <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #9f1239; line-height: 1.5;">
                    ℹ️ If you have any questions regarding this decision, please reach out to your HR supervisor or line manager.
                </div>
                `}

                <!-- Action Button -->
                <div style="text-align: center; margin: 26px 0 10px 0;">
                    <a href="https://velora-crm-entreprise.vercel.app/attendance" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none;">
                        View Attendance Portal →
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                This automated message was generated by Velora CRM Workforce Engine.
            </div>
        </div>
    </div>
    `;

    return dispatchEmail({
        to: employeeEmail,
        toName: employeeName,
        subject: `Leave Request ${status}: ${leaveType} (${formattedStart})`,
        htmlContent
    });
};

module.exports = { sendPayslipEmail, sendLeaveApplicationEmail, sendLeaveDecisionEmail };
