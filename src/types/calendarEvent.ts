export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    backgroundColor: string;
    borderColor: string;
    extendedProps: {
        customerName: string;
        customerPhone?: string;
        customerEmail?: string;
        service: string;
        serviceGerman: string;
        extras?: string;
    };
}
