const Invoice = require('../models/Invoice');
const axios = require('axios');
const { publishToQueue } = require('../../../packages/utils');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';

const logError = (msg) => {
    fs.appendFileSync(path.join(__dirname, '../error.log'), new Date().toISOString() + ': ' + msg + '\n');
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public
exports.getInvoices = async (req, res) => {
  try {
    const { email } = req.query;
    let query = {};
    if (email) {
        query.customerEmail = email;
    }
    const invoices = await Invoice.find(query);
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (err) {
    console.error("[Invoice-Service] Error fetching invoices:", err.message);
    logError("Error in getInvoices: " + err.stack);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
};


// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Public
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Public
exports.createInvoice = async (req, res) => {
    console.log("🔥 HIT: createInvoice");
    try {
        console.log("PAYLOAD:", req.body);
        const invoice = new Invoice(req.body);
        
        // Auto-set status to Sent since we are emailing immediately
        invoice.status = 'Sent';
        await invoice.save();
        
        console.log("✅ SAVED Invoice:", invoice._id);

        // --- EMAIL LOGIC START ---
        if (invoice.customerEmail) {
            try {
                const emailContent = `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 0; color: #0f172a; margin: 0;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.02);">
                            <div style="background-color: #09090b; padding: 32px 40px; text-align: left; vertical-align: middle;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td>
                                            <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Velora<span style="color: #ea580c;">.</span></div>
                                        </td>
                                        <td style="text-align: right; vertical-align: middle;">
                                            <div style="color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Invoice Generated</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div style="padding: 40px;">
                                <h2 style="font-size: 20px; font-weight: 800; color: #09090b; margin: 0 0 16px 0; letter-spacing: -0.3px;">Dear ${invoice.customerName},</h2>
                                <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 32px 0;">A new invoice has been generated for your recent project milestone. Please find the statement summary and payment references below.</p>
                                
                                <div style="background-color: #fafafa; border-radius: 12px; border: 1px solid #f4f4f5; padding: 20px; margin-bottom: 32px;">
                                    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                                        <tr>
                                             <td style="color: #71717a; padding: 6px 0;">Invoice Ref:</td>
                                             <td style="font-weight: 700; color: #09090b; text-align: right; padding: 6px 0;">#${invoice._id.toString().slice(-6).toUpperCase()}</td>
                                        </tr>
                                        <tr>
                                             <td style="color: #71717a; padding: 6px 0;">Due Date:</td>
                                             <td style="font-weight: 700; color: #09090b; text-align: right; padding: 6px 0;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
                                        </tr>
                                        <tr>
                                             <td style="color: #71717a; padding: 6px 0;">Total Amount:</td>
                                             <td style="font-weight: 800; color: #ea580c; text-align: right; padding: 6px 0; font-size: 15px;">$${invoice.totalAmount.toFixed(2)}</td>
                                        </tr>
                                    </table>
                                </div>

                                <h3 style="font-size: 12px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Line Items</h3>
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                                    <thead>
                                        <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                                            <th style="padding: 10px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase;">Description</th>
                                            <th style="padding: 10px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; text-align: center; width: 60px;">Qty</th>
                                            <th style="padding: 10px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; text-align: right; width: 100px;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody style="font-size: 13px;">
                                        ${invoice.items.map(item => `
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 12px 0; color: #09090b; font-weight: 600;">${item.description}</td>
                                                <td style="padding: 12px 0; color: #71717a; text-align: center;">${item.quantity}</td>
                                                <td style="padding: 12px 0; color: #09090b; font-weight: 700; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>

                                 <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                                     <a href="${GATEWAY_URL}/api/invoices/${invoice._id}/download" style="background-color: #09090b; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Download Invoice</a>
                                 </div>
                            </div>
                            <div style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa;">
                                <p style="margin: 0 0 4px 0;">This email is sent on behalf of Velora. Do not reply directly.</p>
                                <p style="margin: 0;">© 2026 Velora Technologies. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                `;

                const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications/email';
                const emailPayload = {
                    to: invoice.customerEmail,
                    subject: `New Invoice #${invoice._id.toString().slice(-6).toUpperCase()} from Company`,
                    message: emailContent
                };
                const fallbackSend = () => axios.post(NOTIFICATION_SERVICE, emailPayload);
                await publishToQueue('email_notifications', emailPayload, fallbackSend);
                console.log("📧 Email notification handled for:", invoice.customerEmail);
            } catch (emailErr) {
                console.error("⚠️ Failed to send email (Invoice created anyway):", emailErr.message);
            }
        }
        // --- EMAIL LOGIC END ---

        res.status(201).json({ success: true, data: invoice, message: "Invoice created and sent!" });
    } catch (err) {
        console.error("💥 CRASH:", err);
        res.status(500).json({ error: err.message });
    }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id
// @access  Public
exports.updateInvoice = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const originalStatus = invoice.status;

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // --- NOTIFICATION LOGIC: Payment Received ---
    if (req.body.status === 'Paid' && originalStatus !== 'Paid') {
        try {
             // Notify Admin
             const adminEmail = process.env.SENDER_EMAIL || "admin@companycrm.com";
             const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications/email';
             
             const emailContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 10px; background-color: #f0fdf4;">
                    <h2 style="color: #047857;">Payment Received!</h2>
                    <p><strong>Invoice #${invoice._id.toString().slice(-6).toUpperCase()}</strong> has been marked as PAID.</p>
                    <p>
                        <strong>Ref:</strong> ${invoice._id}<br>
                        <strong>Amount:</strong> $${invoice.totalAmount.toFixed(2)}<br>
                        <strong>Customer:</strong> ${invoice.customerName}
                    </p>
                    <p>The system has updated the status automatically.</p>
                </div>
             `;

             const emailPayload = {
                to: adminEmail,
                subject: `Payment Received: Invoice #${invoice._id.toString().slice(-6).toUpperCase()}`,
                message: emailContent
             };
             const fallbackSend = () => axios.post(NOTIFICATION_SERVICE, emailPayload);
             await publishToQueue('email_notifications', emailPayload, fallbackSend);
             console.log(`[Invoice Service] Payment notification handled for Admin (${adminEmail})`);

        } catch (payNotifyErr) {
            console.error("[Invoice Service] Failed to notify admin of payment:", payNotifyErr.message);
        }
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Public
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Send Invoice via Email
// @route   POST /api/invoices/:id/send
// @access  Public
exports.sendInvoiceEmail = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (!invoice.customerEmail) {
            return res.status(400).json({ success: false, error: 'Customer email is missing' });
        }

        // Construct Email HTML
        const emailContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 0; color: #0f172a; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.02);">
                    <div style="background-color: #09090b; padding: 32px 40px; text-align: left; vertical-align: middle;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td>
                                    <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Velora<span style="color: #ea580c;">.</span></div>
                                </td>
                                <td style="text-align: right; vertical-align: middle;">
                                    <div style="color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Invoice Details</div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div style="padding: 40px;">
                        <h2 style="font-size: 20px; font-weight: 800; color: #09090b; margin: 0 0 16px 0; letter-spacing: -0.3px;">Dear ${invoice.customerName},</h2>
                        <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 32px 0;">Please find below the details of your invoice. We appreciate your business!</p>
                        
                        <div style="background-color: #fafafa; border-radius: 12px; border: 1px solid #f4f4f5; padding: 20px; margin-bottom: 32px;">
                            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                                <tr>
                                     <td style="color: #71717a; padding: 6px 0;">Invoice Ref:</td>
                                     <td style="font-weight: 700; color: #09090b; text-align: right; padding: 6px 0;">#${invoice._id.toString().slice(-6).toUpperCase()}</td>
                                </tr>
                                <tr>
                                     <td style="color: #71717a; padding: 6px 0;">Due Date:</td>
                                     <td style="font-weight: 700; color: #09090b; text-align: right; padding: 6px 0;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                     <td style="color: #71717a; padding: 6px 0;">Total Amount:</td>
                                     <td style="font-weight: 800; color: #ea580c; text-align: right; padding: 6px 0; font-size: 15px;">$${invoice.totalAmount.toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>

                        <h3 style="font-size: 12px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Line Items</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                            <thead>
                                <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                                    <th style="padding: 10px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase;">Description</th>
                                    <th style="padding: 10px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; text-align: center; width: 60px;">Qty</th>
                                    <th style="padding: 10px 0; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; text-align: right; width: 100px;">Total</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 13px;">
                                ${invoice.items.map(item => `
                                    <tr style="border-bottom: 1px solid #f4f4f5;">
                                        <td style="padding: 12px 0; color: #09090b; font-weight: 600;">${item.description}</td>
                                        <td style="padding: 12px 0; color: #71717a; text-align: center;">${item.quantity}</td>
                                        <td style="padding: 12px 0; color: #09090b; font-weight: 700; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                         <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                             <a href="${GATEWAY_URL}/api/invoices/${invoice._id}/download" style="background-color: #09090b; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Download Invoice</a>
                         </div>
                    </div>
                    <div style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa;">
                        <p style="margin: 0 0 4px 0;">This email is sent on behalf of Velora. Do not reply directly.</p>
                        <p style="margin: 0;">© 2026 Velora Technologies. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `;

        // Call Notification Service
        const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications/email';
        
        const emailPayload = {
            to: invoice.customerEmail,
            subject: `Invoice #${invoice._id.toString().slice(-6).toUpperCase()} from Company`,
            message: emailContent
        };
        const fallbackSend = () => axios.post(NOTIFICATION_SERVICE, emailPayload);
        await publishToQueue('email_notifications', emailPayload, fallbackSend);

        // Update Status to 'Sent' if it was 'Draft'
        if (invoice.status === 'Draft') {
            invoice.status = 'Sent';
            await invoice.save();
        }

        res.status(200).json({ success: true, message: 'Invoice sent successfully', data: invoice });

    } catch (err) {
        console.error("❌ Send Invoice Error:", err.message);
        if (err.response) {
            console.error("Response Status:", err.response.status);
            console.error("Response Data:", err.response.data);
        }
        logError("Send Invoice Error: " + err.stack);
        res.status(500).json({ success: false, error: 'Failed to send invoice email' });
    }
};

// @desc    Download Invoice as HTML file attachment
// @route   GET /api/invoices/:id/download
// @access  Public
exports.downloadInvoiceFile = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // HTTP Headers for PDF Download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice._id.toString().slice(-6).toUpperCase()}.pdf`);
        doc.pipe(res);

        // Header logo
        doc.fillColor('#09090b').fontSize(24).font('Helvetica-Bold').text('Velora', 50, 50);
        doc.fillColor('#ea580c').fontSize(24).font('Helvetica-Bold').text('.', 125, 50);
        
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Enterprise CRM Solutions', 50, 80);

        // Invoice title
        doc.fillColor('#09090b').fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, 50, { align: 'right', width: 200 });
        doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text(`Ref: #${invoice._id.toString().slice(-6).toUpperCase()}`, 350, 80, { align: 'right', width: 200 });

        // Divider
        doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e2e8f0').lineWidth(1).stroke();

        // Metadata grid (Billed to and Invoice Info)
        doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('BILLED TO:', 50, 130);
        doc.fillColor('#09090b').fontSize(12).font('Helvetica-Bold').text(invoice.customerName, 50, 145);
        doc.fillColor('#52525b').fontSize(10).font('Helvetica').text(invoice.customerEmail, 50, 160);

        doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('INVOICE INFORMATION:', 350, 130, { align: 'right', width: 200 });
        doc.fillColor('#52525b').fontSize(10).font('Helvetica').text(`Date Issued: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, 350, 145, { align: 'right', width: 200 });
        doc.fillColor('#52525b').fontSize(10).font('Helvetica').text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, 160, { align: 'right', width: 200 });

        // Table Header
        let y = 210;
        doc.fillColor('#f8fafc').rect(50, y, 500, 25).fill();
        doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('DESCRIPTION', 60, y + 8);
        doc.text('QTY', 380, y + 8, { width: 50, align: 'center' });
        doc.text('PRICE', 440, y + 8, { width: 50, align: 'right' });
        doc.text('TOTAL', 500, y + 8, { width: 40, align: 'right' });

        // Table Rows
        y += 25;
        doc.font('Helvetica');
        invoice.items.forEach(item => {
            doc.fillColor('#09090b').fontSize(10).text(item.description, 60, y + 10);
            doc.fillColor('#52525b').fontSize(10).text(item.quantity.toString(), 380, y + 10, { width: 50, align: 'center' });
            doc.text(`$${item.price.toFixed(2)}`, 440, y + 10, { width: 50, align: 'right' });
            doc.fillColor('#09090b').text(`$${(item.price * item.quantity).toFixed(2)}`, 500, y + 10, { width: 40, align: 'right' });
            
            y += 30;
            doc.moveTo(50, y).lineTo(550, y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
        });

        // Totals Card
        y += 15;
        doc.fillColor('#52525b').fontSize(10).font('Helvetica').text('Subtotal:', 380, y);
        doc.fillColor('#09090b').font('Helvetica-Bold').text(`$${invoice.totalAmount.toFixed(2)}`, 480, y, { width: 60, align: 'right' });

        y += 20;
        doc.fillColor('#52525b').font('Helvetica').text('Tax (0.00%):', 380, y);
        doc.fillColor('#09090b').font('Helvetica-Bold').text('$0.00', 480, y, { width: 60, align: 'right' });

        y += 25;
        doc.moveTo(380, y).lineTo(540, y).strokeColor('#cbd5e1').lineWidth(1).stroke();
        
        y += 10;
        doc.fillColor('#ea580c').fontSize(14).font('Helvetica-Bold').text('Grand Total:', 380, y);
        doc.fillColor('#09090b').fontSize(14).text(`$${invoice.totalAmount.toFixed(2)}`, 480, y, { width: 60, align: 'right' });

        // Footer
        doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Thank you for your business. For billing queries, please contact billing@velora.com', 50, 700, { align: 'center', width: 500 });
        doc.fillColor('#cbd5e1').fontSize(8).text('Generated by Velora Enterprise CRM', 50, 720, { align: 'center', width: 500 });

        doc.end();

    } catch (err) {
        res.status(500).send('Error downloading file: ' + err.message);
    }
};
