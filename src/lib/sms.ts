import twilio from 'twilio';

// Load Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
} else {
    console.log('Warn: TWILIO credentials are missing. SMS will execute in mock mode.');
}

/**
 * Send an SMS notification.
 * @param to Recipient phone number (E.164 format recommended, e.g., +1234567890)
 * @param message SMS message content
 */
export async function sendSMS({
    to,
    message,
}: {
    to: string;
    message: string;
}) {
    if (!twilioClient || !fromPhone) {
        console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
        return;
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: fromPhone,
            to: to,
        });
        console.log(`SMS sent successfully: ${result.sid}`);
    } catch (error) {
        console.error('Error sending SMS:', error);
        // Don't crash the request if SMS fails
    }
}
