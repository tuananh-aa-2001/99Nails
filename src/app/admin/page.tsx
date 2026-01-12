'use client';

import { SERVICES, SERVICE_COLORS } from '@/lib/constants';
import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import './admin.css';
import { Appointment } from '@/types/appointment';
import { CalendarEvent } from '@/types/calendarEvent';

// Helper to get mapping from SERVICES
const getServiceMapping = () => {
    const mapping: { [key: string]: string } = {};
    SERVICES.forEach(s => {
        mapping[s.id] = s.name;
    });
    return mapping;
};

const SERVICE_MAPPING = getServiceMapping();

export default function AdminDashboard() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [viewCount, setViewCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const calendarRef = useRef<any>(null);

    useEffect(() => {
        setHasMounted(true);
        fetchAppointments();
    }, []);

    // Also update count when appointments are fetched
    useEffect(() => {
        if (appointments.length > 0 && calendarRef.current) {
            const api = calendarRef.current.getApi();
            const start = api.view.activeStart;
            const end = api.view.activeEnd;
            updateCount(start, end);
        }
    }, [appointments]);

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            const data = await response.json();
            setAppointments(data);
            setLoading(false);
            // Initial count will be handled by datesSet
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setLoading(false);
        }
    };

    const updateCount = (start: Date, end: Date) => {
        const count = appointments.filter(apt => {
            const aptDate = new Date(apt.startTime);
            return aptDate >= start && aptDate < end;
        }).length;
        setViewCount(count);
    };

    const handleDatesSet = (arg: any) => {
        updateCount(arg.start, arg.end);
    };

    const getServiceColor = (service: string) => {
        return SERVICE_COLORS[service] || { bg: '#d4af37', border: '#b08d26' };
    };

    const translateService = (service: string) => {
        return SERVICE_MAPPING[service] || service;
    };

    const events: CalendarEvent[] = appointments.map((apt) => {
        const serviceBaseId = apt.serviceName.split(' - ')[0].toLowerCase().includes('pediküre') ? 'pedikuere' :
            apt.serviceName.split(' - ')[0].toLowerCase().includes('maniküre') ? 'manikuere' :
                apt.serviceName.split(' - ')[0].toLowerCase().includes('neumodellage') ? 'neumodellage' :
                    apt.serviceName.split(' - ')[0].toLowerCase().includes('auffüllen') ? 'auffuellen' :
                        apt.serviceName.split(' - ')[0].toLowerCase().includes('ablösen') ? 'abloesen' : 'neumodellage';

        const color = getServiceColor(serviceBaseId);
        const startTime = new Date(apt.startTime);
        const endTime = new Date(startTime.getTime() + (apt.duration || 45) * 60000);

        return {
            id: apt.id.toString(),
            title: `${apt.serviceName} - ${apt.customer.name}`,
            start: apt.startTime,
            end: endTime.toISOString(),
            backgroundColor: color.bg,
            borderColor: color.border,
            extendedProps: {
                customerName: apt.customer.name,
                customerPhone: apt.customer.phone,
                customerEmail: apt.customer.email,
                service: apt.serviceName,
                serviceGerman: translateService(apt.serviceName),
                extras: apt.extras || undefined,
            },
        };
    });

    const handleEventClick = (info: any) => {
        setSelectedEvent(info.event as any);
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading">Lade Termine...</div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div>
                    <h1>Termin-Dashboard</h1>
                    <p>Willkommen zurück. Hier sind die aktuellen Buchungen.</p>
                </div>
                <div>
                    <p>Termine in dieser Ansicht: <strong>{viewCount}</strong></p>
                </div>
            </header>

            <div className="admin-content">
                <div className="calendar-section">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        locale={deLocale}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        events={events}
                        eventClick={handleEventClick}
                        datesSet={handleDatesSet}
                        height="auto"
                        firstDay={1}
                        slotMinTime="08:00:00"
                        slotMaxTime="20:00:00"
                        slotDuration="00:15:00"
                        slotLabelInterval="00:15:00"
                        allDaySlot={false}
                        nowIndicator={true}
                    />
                </div>

                {selectedEvent && (
                    <div className="event-details">
                        <div className="event-details-header">
                            <h2>Termin-Details</h2>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="close-btn"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="event-details-body">
                            <div className="detail-row">
                                <span className="label">Kunde</span>
                                <span className="value">{selectedEvent.extendedProps.customerName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Service</span>
                                <span className="value">{selectedEvent.extendedProps.serviceGerman}</span>
                            </div>
                            {selectedEvent.extendedProps.customerPhone && (
                                <div className="detail-row">
                                    <span className="label">Telefon</span>
                                    <span className="value">
                                        <a href={`tel:${selectedEvent.extendedProps.customerPhone}`}>
                                            {selectedEvent.extendedProps.customerPhone}
                                        </a>
                                    </span>
                                </div>
                            )}
                            {selectedEvent.extendedProps.customerEmail && (
                                <div className="detail-row">
                                    <span className="label">Email</span>
                                    <span className="value">
                                        <a href={`mailto:${selectedEvent.extendedProps.customerEmail}`}>
                                            {selectedEvent.extendedProps.customerEmail}
                                        </a>
                                    </span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="label">Zeitpunkt</span>
                                <span className="value">
                                    {hasMounted && new Date(selectedEvent.start!).toLocaleString('de-DE', {
                                        dateStyle: 'full',
                                        timeStyle: 'short',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="legend">
                <h3>Service-Arten</h3>
                <div className="legend-items">
                    {Object.entries(SERVICE_MAPPING).map(([id, name]) => (
                        <div key={id} className="legend-item">
                            <span
                                className="legend-color"
                                style={{ backgroundColor: SERVICE_COLORS[id]?.bg }}
                            ></span>
                            {name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
