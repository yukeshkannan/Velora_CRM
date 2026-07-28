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

// Helper function to generate rich, state-aware, professional HTML email for invoices
const generateInvoiceEmailHTML = (invoice) => {
    const ref = invoice._id ? invoice._id.toString().slice(-6).toUpperCase() : 'INV';
    const paidAmount = invoice.paidAmount || (invoice.status === 'Paid' ? invoice.totalAmount : 0);
    const totalAmount = invoice.totalAmount || 0;
    const balance = Math.max(0, totalAmount - paidAmount);
    const dueDateStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const status = invoice.status || 'Sent';

    let statusBg = '#eff6ff';
    let statusText = '#2563eb';
    let statusBorder = '#bfdbfe';
    let statusLabel = 'INVOICE ISSUED';

    if (status === 'Paid') {
        statusBg = '#ecfdf5';
        statusText = '#059669';
        statusBorder = '#a7f3d0';
        statusLabel = 'PAID IN FULL';
    } else if (status === 'Partially Paid') {
        statusBg = '#fffbeb';
        statusText = '#d97706';
        statusBorder = '#fde68a';
        statusLabel = 'PARTIALLY PAID';
    }

    let introText = `Please find below the official statement details for your invoice. We appreciate your business!`;
    if (status === 'Partially Paid') {
        introText = `Thank you for your recent payment! We have successfully received and processed your partial payment of <strong style="color: #059669;">$${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>. Below is your updated statement showing your total payment progress and remaining balance due.`;
    } else if (status === 'Paid') {
        introText = `Thank you for your payment! Invoice <strong>#${ref}</strong> has been fully settled ($${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}). Please find your official payment receipt statement below.`;
    }

    const itemsRows = (invoice.items || []).map(item => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 14px 16px; color: #0f172a; font-weight: 600; font-size: 13px;">${item.description || 'Custom Service Item'}</td>
            <td style="padding: 14px 16px; color: #64748b; text-align: center; font-size: 13px;">${item.quantity || 1}</td>
            <td style="padding: 14px 16px; color: #64748b; text-align: right; font-size: 13px;">$${(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 14px 16px; color: #0f172a; font-weight: 700; text-align: right; font-size: 13px;">$${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 16px; color: #0f172a;">
            <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.05);">
                
                <!-- Brand Header -->
                <div style="background: linear-gradient(135deg, #09090b 0%, #1e293b 100%); padding: 32px 36px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td>
                                <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Velora<span style="color: #6366f1;">.</span></div>
                                <div style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 4px;">Official Statement & Invoice</div>
                            </td>
                            <td style="text-align: right; vertical-align: middle;">
                                <span style="background-color: ${statusBg}; color: ${statusText}; border: 1px solid ${statusBorder}; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; display: inline-block;">
                                    ${statusLabel}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Main Content -->
                <div style="padding: 36px;">
                    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Dear ${invoice.customerName || 'Valued Client'},</h2>
                    <p style="font-size: 14px; color: #475569; line-height: 1.65; margin: 0 0 28px 0;">${introText}</p>
                    
                    <!-- Financial Summary Box -->
                    <div style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 32px;">
                        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                            <tr>
                                <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Invoice Reference:</td>
                                <td style="font-weight: 800; color: #0f172a; text-align: right; padding: 6px 0;">#${ref}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Due Date:</td>
                                <td style="font-weight: 700; color: #0f172a; text-align: right; padding: 6px 0;">${dueDateStr}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Total Invoice Amount:</td>
                                <td style="font-weight: 800; color: #0f172a; text-align: right; padding: 6px 0; font-size: 14px;">$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td style="color: #059669; padding: 6px 0; font-weight: 600;">Amount Paid to Date:</td>
                                <td style="font-weight: 800; color: #059669; text-align: right; padding: 6px 0; font-size: 14px;">-$${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr style="border-top: 2px dashed #cbd5e1;">
                                <td style="color: #0f172a; padding: 12px 0 4px 0; font-weight: 800; font-size: 14px;">Remaining Balance Due:</td>
                                <td style="font-weight: 900; color: ${balance > 0 ? '#d97706' : '#059669'}; text-align: right; padding: 12px 0 4px 0; font-size: 16px;">$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Line Items -->
                    <h3 style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Service Items Breakdown</h3>
                    <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 32px;">
                        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
                            <thead>
                                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left;">
                                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Description</th>
                                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: right; width: 90px;">Price</th>
                                    <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: right; width: 100px;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsRows}
                            </tbody>
                        </table>
                    </div>

                    <!-- CTA Link -->
                    <div style="text-align: center; margin-top: 36px; margin-bottom: 12px;">
                        <a href="${GATEWAY_URL}/api/invoices/${invoice._id}/download" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 15px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; display: inline-block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
                            DOWNLOAD STATEMENT
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 24px 36px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 6px 0; font-weight: 500;">This official statement was automatically generated by Velora Enterprise CRM.</p>
                    <p style="margin: 0;">© 2026 Velora Technologies. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const getInvoiceSubject = (invoice) => {
    const ref = invoice._id ? invoice._id.toString().slice(-6).toUpperCase() : 'INV';
    if (invoice.status === 'Partially Paid') {
        return `[Payment Receipt] Partial Payment Received - Invoice #${ref}`;
    } else if (invoice.status === 'Paid') {
        return `[Official Receipt] Payment Received (Paid in Full) - Invoice #${ref}`;
    }
    return `[Invoice Statement] Invoice #${ref} from Velora`;
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
        
        // Auto-set status to Sent since we are emailing immediately if status not set
        if (!invoice.status) {
            invoice.status = 'Sent';
        }
        await invoice.save();
        
        console.log("✅ SAVED Invoice:", invoice._id);

        // --- EMAIL LOGIC START ---
        if (invoice.customerEmail) {
            try {
                const emailContent = generateInvoiceEmailHTML(invoice);
                const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications/email';
                const emailPayload = {
                    to: invoice.customerEmail,
                    subject: getInvoiceSubject(invoice),
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
    if ((req.body.status === 'Paid' && originalStatus !== 'Paid') || (req.body.status === 'Partially Paid' && originalStatus !== 'Partially Paid')) {
        try {
             // Notify Admin
             const adminEmail = process.env.SENDER_EMAIL || "admin@companycrm.com";
             const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications/email';
             
             const emailContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 10px; background-color: #f0fdf4;">
                    <h2 style="color: #047857;">Payment Activity Recorded!</h2>
                    <p><strong>Invoice #${invoice._id.toString().slice(-6).toUpperCase()}</strong> has updated status: <strong>${invoice.status}</strong>.</p>
                    <p>
                        <strong>Total Amount:</strong> $${invoice.totalAmount.toFixed(2)}<br>
                        <strong>Paid to Date:</strong> $${(invoice.paidAmount || 0).toFixed(2)}<br>
                        <strong>Customer:</strong> ${invoice.customerName} (${invoice.customerEmail})
                    </p>
                    <p>The system has updated the invoice record automatically.</p>
                </div>
             `;

             const emailPayload = {
                to: adminEmail,
                subject: `Payment Activity: Invoice #${invoice._id.toString().slice(-6).toUpperCase()} (${invoice.status})`,
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

        // Construct Rich State-Aware Email HTML
        const emailContent = generateInvoiceEmailHTML(invoice);

        // Call Notification Service
        const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications/email';
        
        const emailPayload = {
            to: invoice.customerEmail,
            subject: getInvoiceSubject(invoice),
            message: emailContent
        };
        const fallbackSend = () => axios.post(NOTIFICATION_SERVICE, emailPayload);
        await publishToQueue('email_notifications', emailPayload, fallbackSend);

        // Update Status to 'Sent' if it was 'Draft'
        if (invoice.status === 'Draft') {
            invoice.status = 'Sent';
            await invoice.save();
        }

        res.status(200).json({ success: true, message: 'Invoice email sent successfully', data: invoice });

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

// @desc    Download Invoice as PDF file attachment
// @route   GET /api/invoices/:id/download
// @access  Public
exports.downloadInvoiceFile = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        const ref = invoice._id ? invoice._id.toString().slice(-6).toUpperCase() : 'INV';
        const paidAmount = invoice.paidAmount || (invoice.status === 'Paid' ? invoice.totalAmount : 0);
        const totalAmount = invoice.totalAmount || 0;
        const balance = Math.max(0, totalAmount - paidAmount);
        const status = invoice.status || 'Sent';

        let statusText = 'INVOICE ISSUED';
        let statusColor = '#2563eb';
        if (status === 'Paid') {
            statusText = 'PAID IN FULL';
            statusColor = '#059669';
        } else if (status === 'Partially Paid') {
            statusText = 'PARTIALLY PAID';
            statusColor = '#d97706';
        }

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        
        // HTTP Headers for PDF Download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Statement-${ref}.pdf`);
        doc.pipe(res);

        // Header Dark Banner Box
        doc.fillColor('#09090b').rect(40, 40, 515, 65).fill();
        
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('Velora', 55, 55);
        doc.fillColor('#6366f1').fontSize(22).font('Helvetica-Bold').text('.', 125, 55);
        doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Bold').text('OFFICIAL STATEMENT & INVOICE', 55, 80);

        // Status Badge in header
        doc.fillColor(statusColor).fontSize(10).font('Helvetica-Bold').text(statusText, 350, 65, { align: 'right', width: 190 });

        // Greeting & Intro
        let y = 125;
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(`Dear ${invoice.customerName || 'Valued Client'},`, 40, y);
        y += 20;
        doc.fillColor('#475569').fontSize(9.5).font('Helvetica').text(
            status === 'Partially Paid'
                ? `Thank you for your recent payment of $${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Below is your updated official statement showing payment progress and balance due.`
                : status === 'Paid'
                ? `Thank you for your payment! Invoice #${ref} has been fully settled ($${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}). Below is your official receipt.`
                : `Please find below the official billing statement details for reference #${ref}.`,
            40, y, { width: 515, lineGap: 3 }
        );

        // Financial Summary Box
        y += 40;
        doc.fillColor('#f8fafc').rect(40, y, 515, 105).fill();
        doc.rect(40, y, 515, 105).strokeColor('#e2e8f0').lineWidth(1).stroke();

        let boxY = y + 12;
        doc.fillColor('#64748b').fontSize(9.5).font('Helvetica').text('Invoice Reference:', 55, boxY);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(`#${ref}`, 350, boxY, { align: 'right', width: 190 });

        boxY += 18;
        doc.fillColor('#64748b').font('Helvetica').text('Due Date:', 55, boxY);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A', 350, boxY, { align: 'right', width: 190 });

        boxY += 18;
        doc.fillColor('#64748b').font('Helvetica').text('Total Invoice Amount:', 55, boxY);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(`$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 350, boxY, { align: 'right', width: 190 });

        boxY += 18;
        doc.fillColor('#059669').font('Helvetica-Bold').text('Amount Paid to Date:', 55, boxY);
        doc.fillColor('#059669').font('Helvetica-Bold').text(`-$${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 350, boxY, { align: 'right', width: 190 });

        boxY += 20;
        doc.moveTo(55, boxY).lineTo(540, boxY).dash(4, { space: 3 }).strokeColor('#cbd5e1').stroke().undash();
        boxY += 6;
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Remaining Balance Due:', 55, boxY);
        doc.fillColor(balance > 0 ? '#d97706' : '#059669').fontSize(12).font('Helvetica-Bold').text(`$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 350, boxY, { align: 'right', width: 190 });

        // Line Items Table
        y = y + 125;
        doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('SERVICE ITEMS BREAKDOWN', 40, y);
        
        y += 15;
        doc.fillColor('#f8fafc').rect(40, y, 515, 22).fill();
        doc.rect(40, y, 515, 22).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('DESCRIPTION', 50, y + 6);
        doc.text('QTY', 360, y + 6, { width: 40, align: 'center' });
        doc.text('PRICE', 410, y + 6, { width: 65, align: 'right' });
        doc.text('TOTAL', 485, y + 6, { width: 60, align: 'right' });

        y += 22;
        doc.font('Helvetica');
        (invoice.items || []).forEach(item => {
            doc.fillColor('#0f172a').fontSize(9.5).text(item.description || 'Service Item', 50, y + 8, { width: 300 });
            doc.fillColor('#64748b').fontSize(9.5).text((item.quantity || 1).toString(), 360, y + 8, { width: 40, align: 'center' });
            doc.text(`$${(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 410, y + 8, { width: 65, align: 'right' });
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(`$${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 485, y + 8, { width: 60, align: 'right' });
            
            y += 24;
            doc.moveTo(40, y).lineTo(555, y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
        });

        // Footer
        doc.fillColor('#94a3b8').fontSize(8.5).font('Helvetica').text('This official statement was automatically generated by Velora Enterprise CRM.', 40, 720, { align: 'center', width: 515 });
        doc.fillColor('#cbd5e1').fontSize(8).text('© 2026 Velora Technologies. All rights reserved.', 40, 735, { align: 'center', width: 515 });

        doc.end();

    } catch (err) {
        res.status(500).send('Error downloading file: ' + err.message);
    }
};
