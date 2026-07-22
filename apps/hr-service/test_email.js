require('dotenv').config();
const { sendPayslipEmail } = require('./utils/emailService');

const runTest = async () => {
    console.log("Running email send test after IP authorization...");
    console.log("BREVO_API_KEY present:", !!process.env.BREVO_API_KEY);
    console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL);

    try {
        const success = await sendPayslipEmail(
            'yukesh785.in@gmail.com', // Test recipient
            'Test Employee',           // Name
            'July',                    // Month
            2026,                      // Year
            85000,                     // Net Salary
            90000,                     // Base Salary
            28,                        // Present Days
            30,                        // Total Days
            3000                       // Pay Per Day
        );

        if (success) {
            console.log("SUCCESS: Email sent successfully via Brevo!");
        } else {
            console.log("FAILED: Email could not be sent. Check Brevo logs/API key.");
        }
        process.exit(success ? 0 : 1);
    } catch (err) {
        console.error("Test execution encountered an error:", err);
        process.exit(1);
    }
};

runTest();
