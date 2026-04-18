/**
 * SMS Service — Twilio
 * 
 * Sends SMS notifications to farmers (follow-up reminders, loan updates).
 * 
 * To enable:
 *   1. Sign up at https://www.twilio.com (free trial = $15 credit)
 *   2. Add to .env:
 *      TWILIO_ACCOUNT_SID=ACxxxxxxxx
 *      TWILIO_AUTH_TOKEN=xxxxxxxx
 *      TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
 *   3. For Indian numbers, verify them in Twilio trial mode
 */

/**
 * Send an SMS message.
 * @param {string} to - Recipient phone number (with country code, e.g. "+919876543210")
 * @param {string} message - SMS message text
 * @returns {Object|null} Twilio response or null if not configured
 */
export async function sendSMS(to, message) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        console.log(`📱 SMS (not sent — Twilio not configured): To: ${to} | ${message}`);
        return null;
    }

    try {
        // Format phone number for India if needed
        const formattedTo = formatIndianPhone(to);

        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                To: formattedTo,
                From: fromNumber,
                Body: message,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Twilio error:", data.message || data);
            return null;
        }

        console.log(`📱 SMS sent to ${formattedTo}: ${data.sid}`);
        return { sid: data.sid, status: data.status };

    } catch (error) {
        console.error("SMS Service error:", error.message);
        return null;
    }
}

/**
 * Send a diagnosis follow-up reminder.
 */
export async function sendFollowUpReminder(phone, farmerName, disease, followUpDate) {
    const dateStr = new Date(followUpDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const message = `Namaste ${farmerName}! 🌾 KisanTrust reminder: Your crop was diagnosed with "${disease}". Please upload a follow-up photo by ${dateStr} to track improvement and build your Agri-Trust Score. Open app: kisantrust.in`;

    return sendSMS(phone, message);
}

/**
 * Send loan status notification.
 */
export async function sendLoanNotification(phone, farmerName, status, amount) {
    const statusText = status === "approved"
        ? `✅ APPROVED! ₹${amount.toLocaleString("en-IN")} loan has been approved`
        : `❌ Your ₹${amount.toLocaleString("en-IN")} loan application was not approved this time`;

    const message = `Namaste ${farmerName}! 🏦 KisanTrust Loan Update: ${statusText}. Keep building your Agri-Trust Score for better loan access.`;

    return sendSMS(phone, message);
}

/**
 * Format Indian phone number to E.164 format.
 * "9876543210" → "+919876543210"
 */
function formatIndianPhone(phone) {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length === 12) {
        return "+" + cleaned;
    }
    if (cleaned.length === 10) {
        return "+91" + cleaned;
    }
    // Already has + or is international
    if (phone.startsWith("+")) return phone;
    return "+91" + cleaned;
}
