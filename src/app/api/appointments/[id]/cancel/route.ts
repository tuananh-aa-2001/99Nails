import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Need to define params type for Next.js App Router dynamic routes
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const appointmentId = parseInt(id);

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { customer: true },
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Update status
        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' },
        });

        // Notify User
        if (appointment.customer.email) {
            await sendEmail({
                to: appointment.customer.email,
                subject: 'Appointment Cancelled',
                text: `Your appointment on ${appointment.startTime.toLocaleString()} has been cancelled.`,
            });
        }

        // Check time diff for Operator Notification
        const now = new Date();
        const apptTime = new Date(appointment.startTime);

        console.log(`[OPERATOR NOTIFICATION] Appointment ${appointmentId} cancelled. Time slot freed: ${apptTime}`);

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Cancel error', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
