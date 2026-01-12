import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Appointment {
    startTime: string | Date;
    duration?: number;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    // If email or phone provided, filter by customer
    const where: any = {};
    if (email || phone) {
        where.customer = {
            OR: [
                email ? { email } : null,
                phone ? { phone } : null,
            ].filter(Boolean),
        };
    }

    const appointments = await prisma.appointment.findMany({
        where,
        include: { customer: true },
        orderBy: { startTime: 'asc' },
    });
    return NextResponse.json(appointments);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { startTime, service, extras, customer } = body;

        let dbCustomer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { email: customer.email },
                    { phone: customer.phone },
                ].filter((c): c is { email: string } | { phone: string } => {
                    return !!Object.values(c)[0];
                }),
            },
        });

        if (!dbCustomer) {
            dbCustomer = await prisma.customer.create({
                data: {
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                },
            });
        }

        const appointmentDate = new Date(startTime);
        if (appointmentDate.getDay() === 0) {
            return NextResponse.json({ error: 'Sonntags haben wir geschlossen. Bitte wählen Sie einen anderen Tag.' }, { status: 400 });
        }

        // Service durations configuration
        const SERVICE_DURATIONS: Record<string, number> = {
            'Manicure': 45,
            'Pedicure': 60,
            'Full Set': 90
        };

        const duration = SERVICE_DURATIONS[service] || 45;
        const totalDurationWithBuffer = duration + 15;
        const requestedEnd = new Date(appointmentDate.getTime() + duration * 60000);
        const requestedEndWithBuffer = new Date(requestedEnd.getTime() + 15 * 60000);

        // Check for double booking with 15-minute buffer
        const conflict = await prisma.appointment.findFirst({
            where: {
                status: 'CONFIRMED',
                OR: [
                    {
                        // Existing appointment overlaps with requested window (including requested buffer)
                        startTime: {
                            lt: requestedEndWithBuffer,
                        },
                        // We need to account for the buffer of the existing appointment too
                        // But since we block slotStart to slotStart + duration + 15, 
                        // any collision in that window is a conflict.
                    }
                ]
            },
        });

        // Refined conflict check: 
        // Existing [S_e, E_e + 15] overlaps with Requested [S_r, E_r + 15]
        // Condition for overlap: S_e < E_r + 15 AND S_r < E_e + 15

        const appointments = await prisma.appointment.findMany({
            where: {
                status: 'CONFIRMED',
                startTime: {
                    gte: new Date(appointmentDate.getTime() - 120 * 60000), // Check within 2 hours range
                    lte: new Date(appointmentDate.getTime() + 120 * 60000),
                }
            }
        });

        const hasConflict = appointments.some((apt: Appointment) => {
            const existingStart = new Date(apt.startTime);
            const existingEndWithBuffer = new Date(
                existingStart.getTime() + ((apt.duration ?? 45) + 15) * 60000
            );
            const requestedStart = appointmentDate;
            const requestedEndWithBufferValue = new Date(requestedStart.getTime() + (duration + 15) * 60000);

            return existingStart < requestedEndWithBufferValue && requestedStart < existingEndWithBuffer;
        });

        if (hasConflict) {
            return NextResponse.json({ error: 'Dieser Termin ist bereits belegt. Bitte wählen Sie eine andere Zeit.' }, { status: 400 });
        }

        const appointment = await prisma.appointment.create({
            data: {
                startTime: appointmentDate,
                serviceName: service,
                extras: extras,
                customerId: dbCustomer.id,
                duration: duration
            },
        });

        const localizedTime = new Date(startTime).toLocaleString('de-DE', {
            dateStyle: 'full',
            timeStyle: 'short',
        });

        if (dbCustomer.email) {
            await sendEmail({
                to: dbCustomer.email,
                subject: 'Terminbestätigung - LCM Nails',
                text: `Hallo ${dbCustomer.name},\n\nIhr Termin für ${service} wurde für den ${localizedTime} bestätigt.\n\nWir freuen uns auf Ihren Besuch!`,
            });
        }

        if (dbCustomer.phone) {
            await sendSMS({
                to: dbCustomer.phone,
                message: `Hallo ${dbCustomer.name}, Ihr Termin für ${service} am ${localizedTime} wurde bestätigt. Ihr LCM Nails Team.`,
            });
        }

        return NextResponse.json(appointment);
    } catch (error) {
        console.error('Failed to create appointment', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
