import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Appointment {
    startTime: string | Date;
    duration?: number;
}
interface Customer {
    appointments: Appointment[];
}

export async function POST(request: Request) {
    try {
        const { email, phone } = await request.json();

        if (!email && !phone) {
            return NextResponse.json({ error: 'Email or Phone required' }, { status: 400 });
        }

        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    email ? { email: { equals: email } } : undefined,
                    phone ? { phone: { contains: phone } } : undefined,
                ].filter(Boolean) as any,
            },
            include: {
                appointments: {
                    orderBy: { startTime: 'desc' },
                    where: {
                        startTime: { gt: new Date() },
                        status: { not: 'CANCELLED' }
                    }
                }
            }
        });

        const appointments = customers.flatMap((c: Customer) => c.appointments);

        return NextResponse.json(appointments);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Structure Error' }, { status: 500 });
    }
}
