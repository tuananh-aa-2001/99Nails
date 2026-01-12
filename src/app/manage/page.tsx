'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './manage.css';

import { Appointment } from '@/types/appointment';

export default function ManageAppointmentPage() {
    const [searchType, setSearchType] = useState<'email' | 'phone'>('email');
    const [searchValue, setSearchValue] = useState('');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rescheduleId, setRescheduleId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [hasMounted, setHasMounted] = useState(false);

    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);


    useEffect(() => {
        setHasMounted(true);
    }, []);

    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (selectedDate && hasMounted) {
            fetchBookedSlots(selectedDate);
        }
    }, [selectedDate, hasMounted]);

    const fetchBookedSlots = async (date: string) => {
        try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
                const allAppointments = await response.json();
                const dayAppointments = allAppointments.filter((apt: Appointment) => {
                    const aptDate = formatDateLocal(new Date(apt.startTime));
                    return aptDate === date && apt.status !== 'CANCELLED';
                });
                setBookedAppointments(dayAppointments);
            }
        } catch (error) {
            console.error('Error fetching booked slots:', error);
        }
    };

    const generateTimeSlots = () => {
        const slots = [];
        const startHour = 8;
        const endHour = 19;

        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                if (hour === endHour && minute > 0) break;

                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }
        return slots;
    };

    const isSlotBooked = (time: string, currentApt: Appointment) => {
        if (!selectedDate) return false;

        const slotStart = new Date(`${selectedDate}T${time}`);
        const requestedDuration = currentApt.duration || 45;
        const requestedEndWithBuffer = new Date(slotStart.getTime() + (requestedDuration + 15) * 60000);

        return bookedAppointments.some(apt => {
            // Don't check against the appointment we are rescheduling
            if (apt.id === currentApt.id) return false;

            const existingStart = new Date(apt.startTime);
            const existingDuration = apt.duration || 45;
            const existingEndWithBuffer = new Date(existingStart.getTime() + (existingDuration + 15) * 60000);

            return slotStart < existingEndWithBuffer && existingStart < requestedEndWithBuffer;
        });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const params = new URLSearchParams();
            if (searchType === 'email') {
                params.append('email', searchValue);
            } else {
                params.append('phone', searchValue);
            }

            const response = await fetch(`/api/appointments?${params}`);
            const data = await response.json();

            if (data.length === 0) {
                setError(`Keine Termine für diese ${searchType === 'email' ? 'E-Mail' : 'Telefonnummer'} gefunden`);
                setAppointments([]);
            } else {
                setAppointments(data);
            }
        } catch (err) {
            setError('Suche fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = async (appointmentId: number) => {
        if (!selectedDate || !selectedTime) {
            setError('Bitte wählen Sie ein neues Datum und eine Uhrzeit');
            return;
        }

        if (!showRescheduleDialog) {
            setShowRescheduleDialog(true);
            return;
        }

        setShowRescheduleDialog(false);
        setLoading(true);
        setError('');
        setSuccessMessage(''); // Clear previous messages

        const newDateTime = `${selectedDate}T${selectedTime}`;
        const isSunday = new Date(newDateTime).getDay() === 0;
        if (isSunday) {
            setError('Sonntags haben wir geschlossen. Bitte wählen Sie ein anderes Datum.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage(''); // Clear previous messages

        try {
            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startTime: newDateTime }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Umbuchung fehlgeschlagen');
            }

            setSuccessMessage(`Termin wird auf den ${new Date(newDateTime).toLocaleString('de-DE')} verschoben...`);

            // Artificial delay to let the user see the "shifting" state if it's too fast
            await new Promise(resolve => setTimeout(resolve, 800));

            setSuccessMessage('Termin erfolgreich verschoben! Eine Bestätigung wurde gesendet.');
            setRescheduleId(null);
            setSelectedDate('');
            setSelectedTime('');

            // Refresh appointments
            handleSearch(new Event('submit') as any);
        } catch (err: any) {
            setError(err.message || 'Termin konnte nicht verschoben werden');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (appointmentId: number) => {
        setAppointmentToCancel(appointmentId);
        setShowCancelDialog(true);
    };

    const handleCancelConfirm = async () => {
        if (!appointmentToCancel) return;
        setShowCancelDialog(false);
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/appointments/${appointmentToCancel}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Stornierung fehlgeschlagen');
            }

            setSuccessMessage('Termin erfolgreich storniert! Sie erhalten eine Bestätigung per E-Mail.');

            setSearchValue('');

            // Refresh appointments
            handleSearch(new Event('submit') as any);
        } catch (err) {
            setError('Termin konnte nicht storniert werden');
        } finally {
            setLoading(false);
            setAppointmentToCancel(null);
        }
    };

    const handleCancelDecline = () => {
        setShowCancelDialog(false);
        setAppointmentToCancel(null);
    };

    return (
        <div className="manage-container">
            <header className="manage-header">
                <h1>Meine Termine verwalten</h1>
                <p>Finden und verschieben Sie Ihre Termine</p>
            </header>

            <div className="search-card">
                <form onSubmit={handleSearch}>
                    <div className="search-tabs">
                        <button
                            type="button"
                            className={`tab ${searchType === 'email' ? 'active' : ''}`}
                            onClick={() => { setSearchType('email'); setSearchValue(''); }}
                        >
                            E-Mail
                        </button>
                        <button
                            type="button"
                            className={`tab ${searchType === 'phone' ? 'active' : ''}`}
                            onClick={() => { setSearchType('phone'); setSearchValue(''); }}
                        >
                            Telefon
                        </button>
                    </div>

                    <div className="search-input-group">
                        <input
                            type={searchType === 'email' ? 'email' : 'tel'}
                            placeholder={searchType === 'email' ? 'ihre@email.de' : '+49 123 4567890'}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            required
                            className="search-input"
                        />
                        <button type="submit" className="search-btn" disabled={loading}>
                            {loading ? 'Suche...' : 'Termine finden'}
                        </button>
                    </div>
                </form>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
            </div>

            {appointments.length > 0 && (
                <div className="appointments-list">
                    <h2>Ihre Termine ({appointments.length})</h2>
                    {appointments.map((apt) => (
                        <div key={apt.id} className="appointment-card">
                            <div className="appointment-header">
                                <h3>{apt.serviceName}</h3>
                                <span className={`status-badge ${apt.status.toLowerCase()}`}>
                                    {apt.status === 'PENDING' ? 'AUSSTEHEND' :
                                        apt.status === 'CONFIRMED' ? 'BESTÄTIGT' :
                                            apt.status === 'CANCELLED' ? 'STORNIERT' : apt.status}
                                </span>
                            </div>

                            <div className="appointment-details">
                                <div className="detail-item">
                                    <span className="icon">📅</span>
                                    <span>{hasMounted && new Date(apt.startTime).toLocaleString('de-DE', {
                                        dateStyle: 'full',
                                        timeStyle: 'short',
                                    })}</span>
                                </div>
                                {apt.extras && (
                                    <div className="detail-item">
                                        <span className="icon">✨</span>
                                        <span>{apt.extras}</span>
                                    </div>
                                )}
                            </div>

                            {rescheduleId === apt.id ? (
                                <div className="reschedule-form">
                                    <label>Neues Datum und Uhrzeit wählen:</label>

                                    <div className="calendar-container">
                                        <div className="calendar-header">
                                            <button
                                                type="button"
                                                className="month-nav-btn"
                                                onClick={() => {
                                                    const d = new Date(selectedDate || new Date());
                                                    d.setMonth(d.getMonth() - 1);
                                                    setSelectedDate(formatDateLocal(d));
                                                }}
                                            >
                                                &lt;
                                            </button>
                                            <h3>
                                                {hasMounted && new Date(selectedDate || new Date()).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <button
                                                type="button"
                                                className="month-nav-btn"
                                                onClick={() => {
                                                    const d = new Date(selectedDate || new Date());
                                                    d.setMonth(d.getMonth() + 1);
                                                    setSelectedDate(formatDateLocal(d));
                                                }}
                                            >
                                                &gt;
                                            </button>
                                        </div>

                                        <div className="calendar-grid">
                                            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                                                <div key={d} className="calendar-day-name">{d}</div>
                                            ))}
                                            {(() => {
                                                const date = new Date(selectedDate || new Date());
                                                const year = date.getFullYear();
                                                const month = date.getMonth();
                                                const firstDay = new Date(year, month, 1).getDay();
                                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);

                                                const days = [];
                                                const startOffset = firstDay === 0 ? 6 : firstDay - 1;

                                                for (let i = 0; i < startOffset; i++) {
                                                    days.push(<div key={`empty-${i}`} />);
                                                }

                                                for (let d = 1; d <= daysInMonth; d++) {
                                                    const currentPos = new Date(year, month, d);
                                                    const isoDate = formatDateLocal(currentPos);
                                                    const isPast = currentPos < today;
                                                    const isSun = currentPos.getDay() === 0;
                                                    const isSelected = selectedDate === isoDate;
                                                    const isToday = formatDateLocal(currentPos) === formatDateLocal(today);

                                                    days.push(
                                                        <button
                                                            key={d}
                                                            type="button"
                                                            className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'current' : ''} ${isPast || isSun ? 'disabled' : ''}`}
                                                            disabled={isPast || isSun}
                                                            onClick={() => {
                                                                setSelectedDate(isoDate);
                                                                setSelectedTime('');
                                                            }}
                                                        >
                                                            {d}
                                                        </button>
                                                    );
                                                }
                                                return days;
                                            })()}
                                        </div>
                                    </div>

                                    {selectedDate && (
                                        <div className="time-selection">
                                            <p className="time-select-label">Verfügbare Uhrzeiten am {new Date(selectedDate).toLocaleDateString('de-DE')}</p>
                                            <div className="time-grid">
                                                {generateTimeSlots().map(time => {
                                                    const isBooked = isSlotBooked(time, apt);
                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            className={`time-slot ${selectedTime === time ? 'selected' : ''} ${isBooked ? 'disabled' : ''}`}
                                                            disabled={isBooked}
                                                            onClick={() => setSelectedTime(time)}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="reschedule-actions">
                                        <button
                                            onClick={() => handleReschedule(apt.id)}
                                            className={`confirm-btn ${loading ? 'loading' : ''}`}
                                            disabled={loading || !selectedDate || !selectedTime}
                                        >
                                            {loading ? 'Wird verschoben...' : 'Bestätigen'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRescheduleId(null);
                                                setSelectedDate('');
                                                setSelectedTime('');
                                            }}
                                            className="cancel-btn"
                                            disabled={loading}
                                        >
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="appointment-actions">
                                    <button
                                        onClick={() => setRescheduleId(apt.id)}
                                        className="action-btn reschedule"
                                    >
                                        Verschieben
                                    </button>
                                    <button
                                        onClick={() => handleCancelClick(apt.id)}
                                        className="action-btn cancel"
                                        disabled={loading}
                                    >
                                        Stornieren
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showRescheduleDialog && rescheduleId && (
                <div className="dialog-overlay" onClick={() => setShowRescheduleDialog(false)}>
                    <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
                        <h3>Termin verschieben</h3>
                        <p>
                            Möchten Sie Ihren Termin auf den <strong>{new Date(selectedDate).toLocaleDateString('de-DE')}</strong> um <strong>{selectedTime} Uhr</strong> verschieben?
                        </p>
                        <div className="dialog-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowRescheduleDialog(false)}
                            >
                                Abbrechen
                            </button>
                            <button
                                className="btn-primary"
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600' }}
                                onClick={() => handleReschedule(rescheduleId)}
                            >
                                Ja, verschieben
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelDialog && (
                <div className="dialog-overlay" onClick={handleCancelDecline}>
                    <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
                        <h3>Termin stornieren</h3>
                        <p>Sind Sie sicher, dass Sie diesen Termin stornieren möchten?</p>
                        <div className="dialog-actions">
                            <button
                                className="btn-secondary"
                                onClick={handleCancelDecline}
                            >
                                Abbrechen
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleCancelConfirm}
                            >
                                Ja, stornieren
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
