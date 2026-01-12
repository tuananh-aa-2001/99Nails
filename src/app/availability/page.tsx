'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import Link from 'next/link';
import deLocale from '@fullcalendar/core/locales/de';
import './availability.css';

interface Appointment {
    id: number;
    startTime: string;
    endTime: string;
}

export default function AvailabilityPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            const data = await response.json();
            setAppointments(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setLoading(false);
        }
    };

    // Create calendar events showing only occupied slots (no customer details)
    const events = appointments.map((apt) => ({
        title: 'Belegt',
        start: apt.startTime,
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red with 70% opacity
        borderColor: '#DC2626',
        textColor: '#FFFFFF', // White text for better contrast
        display: 'auto', // or 'background' to show only background
    }));

    if (loading) {
        return (
            <div className="availability-container">
                <div className="loading">Lade Verfügbarkeit...</div>
            </div>
        );
    }

    return (
        <div className="availability-container">
            <header className="availability-header">
                <h1>💅 Termin-Verfügbarkeit</h1>
                <p>Sehen Sie unsere freien Termine und planen Sie Ihren Besuch</p>
            </header>

            <div className="info-banner">
                <div className="info-item">
                    <span className="status-indicator occupied">●</span>
                    <span>Belegt</span>
                </div>
                <div className="info-text">
                    Rote Zeitfenster sind bereits gebucht. Alle anderen Zeiten sind verfügbar!
                </div>
            </div>

            <div className="calendar-wrapper">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    locale={deLocale}
                    events={events}
                    height={650}
                    firstDay={1}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    slotDuration="00:15:00"
                    slotLabelInterval="00:15:00"
                    businessHours={{
                        daysOfWeek: [1, 2, 3, 4, 5, 6],
                        startTime: '08:00',
                        endTime: '20:00',
                    }}
                    hiddenDays={[0]}
                />
            </div>

            <div className="action-buttons">
                <Link href="/book" className="primary-btn">
                    Jetzt Termin buchen
                </Link>
                <Link href="/manage" className="secondary-btn">
                    Termin verwalten
                </Link>
            </div>

            <div className="business-hours">
                <h3>Öffnungszeiten</h3>
                <div className="hours-list">
                    <div className="hours-item">
                        <span>Montag - Samstag</span>
                        <span>08:00 - 19:00 Uhr</span>
                    </div>
                    <div className="hours-item">
                        <span>Sonntag</span>
                        <span>Geschlossen</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
