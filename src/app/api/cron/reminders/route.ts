import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();
        const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowEnd = new Date(tomorrowStart.getTime() + 1 * 60 * 60 * 1000);

        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: tomorrowStart,
                    lt: tomorrowEnd,
                },
                status: 'CONFIRMED',
            },
            include: {
                customer: true,
            }
        });

        let sentCount = 0;

        for (const appt of appointments) {
            if (appt.customer.email) {
                await sendEmail({
                    to: appt.customer.email,
                    subject: 'Appointment Reminder - Stylish Nails',
                    text: `Hi ${appt.customer.name}, just a reminder for your appointment tomorrow at ${appt.startTime.toLocaleTimeString()}.`
                });

                sentCount++;
            }
        }

        return NextResponse.json({ success: true, remindersSent: sentCount });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
