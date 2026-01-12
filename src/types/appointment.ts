export interface Appointment {
    id: number;
    startTime: string;
    serviceName: string;
    extras?: string;
    duration: number;
    status: string;
    customer: {
        name: string;
        email?: string;
        phone?: string;
    };
}
