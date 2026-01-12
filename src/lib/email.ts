import sgMail from '@sendgrid/mail';

// We will load the key from env, but fail gracefully if missing (dev mode)
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

if (apiKey) {
    sgMail.setApiKey(apiKey);
} else {
    console.log('Warn: SENDGRID_API_KEY is missing. Emails will execute in mock mode.');
}

/**
 * Send an email notification.
 * @param to Recipient email
 * @param subject Email subject
 * @param text Plain text content
 * @param html HTML content
 */
export async function sendEmail({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    if (!apiKey || !fromEmail) {
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Text: ${text}`);
        return;
    }

    try {
        const msg = {
            to,
            from: {
                email: fromEmail,
                name: 'LCM Nails',
            },
            subject,
            text,
            html: html || `
                <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #7c3aed; margin-top: 0;">LCM Nails</h2>
                    <div style="font-size: 16px; line-height: 1.6;">
                        ${text.replace(/\n/g, '<br>')}
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">Dies ist eine automatische Nachricht. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
                </div>
            `,
        };
        await sgMail.send(msg);
    } catch (error) {
        console.error('Error sending email:', error);
        // throw error; // Don't crash the request if email fails
    }
}
