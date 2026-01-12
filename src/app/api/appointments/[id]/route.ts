import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Appointment {
    startTime: string | Date;
    duration?: number;
}

// GET single appointment by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const appointment = await prisma.appointment.findUnique({
            where: { id: parseInt(id) },
            include: { customer: true },
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Termin nicht gefunden' }, { status: 404 });
        }

        return NextResponse.json(appointment);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH to update/reschedule appointment
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { startTime } = body;

        if (!startTime) {
            return NextResponse.json({ error: 'startTime is required' }, { status: 400 });
        }

        // Get existing appointment
        const existingAppointment = await prisma.appointment.findUnique({
            where: { id: parseInt(id) },
            include: { customer: true },
        });

        if (!existingAppointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        const newDate = new Date(startTime);
        if (newDate.getDay() === 0) {
            return NextResponse.json({ error: 'Sonntags haben wir geschlossen. Bitte wählen Sie einen anderen Tag.' }, { status: 400 });
        }

        // Check for conflicts
        const requestedDuration = existingAppointment.duration || 45;
        const requestedStart = newDate;
        const requestedEndWithBuffer = new Date(requestedStart.getTime() + (requestedDuration + 15) * 60000);

        const conflicts = await prisma.appointment.findMany({
            where: {
                status: 'CONFIRMED',
                startTime: {
                    gte: new Date(requestedStart.getTime() - 120 * 60000),
                    lte: new Date(requestedStart.getTime() + 120 * 60000),
                },
                NOT: { id: parseInt(id) } // Exclude self
            }
        });

        const hasConflict = conflicts.some((apt: Appointment) => {
            const existingStart = new Date(apt.startTime);
            const existingDuration = apt.duration || 45;
            const existingEndWithBuffer = new Date(existingStart.getTime() + (existingDuration + 15) * 60000);
            return existingStart < requestedEndWithBuffer && requestedStart < existingEndWithBuffer;
        });

        if (hasConflict) {
            return NextResponse.json({ error: 'Dieser Termin ist bereits belegt. Bitte wählen Sie eine andere Zeit.' }, { status: 400 });
        }

        // Update appointment
        const updatedAppointment = await prisma.appointment.update({
            where: { id: parseInt(id) },
            data: { startTime: newDate },
            include: { customer: true },
        });

        const localizedTime = new Date(startTime).toLocaleString('de-DE', {
            dateStyle: 'full',
            timeStyle: 'short',
        });

        // Send confirmation email
        if (updatedAppointment.customer.email) {
            await sendEmail({
                to: updatedAppointment.customer.email,
                subject: 'Termin verschoben - LCM Nails',
                text: `Hallo ${updatedAppointment.customer.name},\n\nIhr Termin für ${updatedAppointment.serviceName} wurde erfolgreich auf den ${localizedTime} verschoben.\n\nVielen Dank!`,
            });
        }

        // Send confirmation SMS
        if (updatedAppointment.customer.phone) {
            await sendSMS({
                to: updatedAppointment.customer.phone,
                message: `Hallo ${updatedAppointment.customer.name}, Ihr Termin wurde auf den ${localizedTime} verschoben. Ihr LCM Nails Team.`,
            });
        }

        return NextResponse.json(updatedAppointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE appointment (for cancellation)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const appointment = await prisma.appointment.findUnique({
            where: { id: parseInt(id) },
            include: { customer: true },
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Termin nicht gefunden' }, { status: 404 });
        }

        await prisma.appointment.delete({
            where: { id: parseInt(id) },
        });

        const localizedTime = new Date(appointment.startTime).toLocaleString('de-DE', {
            dateStyle: 'full',
            timeStyle: 'short',
        });

        // Send cancellation email
        if (appointment.customer.email) {
            await sendEmail({
                to: appointment.customer.email,
                subject: 'Termin storniert - LCM Nails',
                text: `Hallo ${appointment.customer.name},\n\nIhr Termin für ${appointment.serviceName} am ${localizedTime} wurde storniert.\n\nBei Fragen können Sie uns jederzeit kontaktieren.\n\nVielen Dank!`,
            });
        }

        // Send cancellation SMS
        if (appointment.customer.phone) {
            await sendSMS({
                to: appointment.customer.phone,
                message: `Hallo ${appointment.customer.name}, Ihr Termin am ${localizedTime} wurde storniert. Ihr LCM Nails Team.`,
            });
        }

        return NextResponse.json({ message: 'Termin erfolgreich storniert' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
