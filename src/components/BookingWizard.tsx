'use client';

import { SERVICES } from '@/lib/constants';
import { useState, useEffect } from 'react';
import styles from './BookingWizard.module.css';
import { Appointment } from '@/types/appointment';

export default function BookingWizard() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        service: '',
        subcategory: '',
        extras: [] as string[],
        date: '',
        time: '',
        name: '',
        email: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);

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
        if (formData.date && hasMounted) {
            fetchBookedSlots(formData.date);
        }
    }, [formData.date, hasMounted]);

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

    const handleExtra = (extra: string) => {
        setFormData(prev => {
            if (prev.extras.includes(extra)) {
                return { ...prev, extras: prev.extras.filter(e => e !== extra) };
            }
            return { ...prev, extras: [...prev.extras, extra] };
        });
    };

    const submitBooking = async () => {
        setLoading(true);
        try {
            const startTime = new Date(`${formData.date}T${formData.time}`);

            const selectedMainService = SERVICES.find(s => s.id === formData.service);
            const selectedSubService = selectedMainService?.subcategories?.find(sub => sub.id === formData.subcategory);
            const serviceName = selectedSubService ? `${selectedMainService?.name} - ${selectedSubService.name}` : selectedMainService?.name || '';
            const duration = selectedSubService?.duration || selectedMainService?.duration || 45;

            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: startTime.toISOString(),
                    service: serviceName,
                    duration,
                    extras: formData.extras.join(', '),
                    customer: {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                    },
                }),
            });

            if (!res.ok) throw new Error('Buchung fehlgeschlagen');

            setResult({ success: true, msg: 'Buchung bestätigt! Bitte prüfen Sie Ihre Emails.' });
            setStep(4);
        } catch (err) {
            setResult({ success: false, msg: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.' });
        } finally {
            setLoading(false);
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

    const isSlotBooked = (time: string) => {
        if (!formData.date || !formData.service) return false;

        const selectedMainService = SERVICES.find(s => s.id === formData.service);
        const selectedSubService = selectedMainService?.subcategories?.find(sub => sub.id === formData.subcategory);

        if (!selectedMainService) return false;
        if (selectedMainService.subcategories && !formData.subcategory) return false;

        const slotStart = new Date(`${formData.date}T${time}`);
        const requestedDuration = selectedSubService?.duration || selectedMainService?.duration || 45;
        const requestedEndWithBuffer = new Date(slotStart.getTime() + (requestedDuration + 15) * 60000);

        return bookedAppointments.some(apt => {
            const existingStart = new Date(apt.startTime);
            // Use the duration from the API, fallback to 45 if not yet populated for older records
            const existingDuration = apt.duration || 45;
            const existingEndWithBuffer = new Date(existingStart.getTime() + (existingDuration + 15) * 60000);

            // Overlap condition: StartA < EndB AND StartB < EndA
            return slotStart < existingEndWithBuffer && existingStart < requestedEndWithBuffer;
        });
    };

    const isSunday = formData.date ? new Date(formData.date).getDay() === 0 : false;

    const selectedMain = SERVICES.find(s => s.id === formData.service);
    const isStep1Valid = !!formData.service && (!selectedMain?.subcategories || !!formData.subcategory);
    const isStep2Valid = !!formData.date && !!formData.time && !isSunday;
    const isStep3Valid = !!formData.name && (!!formData.email || !!formData.phone);

    return (
        <div className={styles.wizard}>
            {/* Progress Indicators */}
            <div className={styles.progress}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>1. Service</div>
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>2. Zeit</div>
                <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>3. Details</div>
            </div>

            <div className={styles.content}>
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2>Service wählen</h2>
                        <div className={styles.options}>
                            {SERVICES.map(s => (
                                <div key={s.id} className={styles.categoryWrapper}>
                                    <div
                                        className={`${styles.optionCard} ${formData.service === s.id ? styles.selected : ''}`}
                                        onClick={() => setFormData({ ...formData, service: s.id, subcategory: '' })}
                                    >
                                        <div className={styles.optionHeader} style={{ justifyContent: 'center' }}>
                                            <span>{s.name}</span>
                                        </div>
                                    </div>

                                    {s.subcategories && formData.service === s.id && (
                                        <div className={styles.subcategoryGrid}>
                                            {s.subcategories.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    className={`${styles.subOption} ${formData.subcategory === sub.id ? styles.selected : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({ ...formData, subcategory: sub.id });
                                                    }}
                                                >
                                                    <span className={styles.subName}>{sub.name}</span>
                                                    <span className={styles.subDuration}>{sub.duration} Min.</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-primary"
                                disabled={!isStep1Valid}
                                onClick={() => setStep(2)}
                            >
                                Nächster Schritt
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.stepContent}>
                        <h2>Datum & Zeit wählen</h2>

                        <div className={styles.calendarContainer}>
                            <div className={styles.calendarHeader}>
                                <button
                                    className={styles.monthNavBtn}
                                    onClick={() => {
                                        const d = new Date(formData.date || new Date());
                                        d.setMonth(d.getMonth() - 1);
                                        setFormData({ ...formData, date: formatDateLocal(d) });
                                    }}
                                >
                                    &lt;
                                </button>
                                <h3>
                                    {hasMounted && new Date(formData.date || new Date()).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button
                                    className={styles.monthNavBtn}
                                    onClick={() => {
                                        const d = new Date(formData.date || new Date());
                                        d.setMonth(d.getMonth() + 1);
                                        setFormData({ ...formData, date: formatDateLocal(d) });
                                    }}
                                >
                                    &gt;
                                </button>
                            </div>

                            <div className={styles.calendarGrid}>
                                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                                    <div key={d} className={styles.calendarDayName}>{d}</div>
                                ))}
                                {(() => {
                                    const date = new Date(formData.date || new Date());
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
                                        const isSelected = formData.date === isoDate;
                                        const isToday = formatDateLocal(currentPos) === formatDateLocal(today);

                                        days.push(
                                            <button
                                                key={d}
                                                className={`${styles.calendarDay} ${isSelected ? styles.selected : ''} ${isToday ? styles.current : ''} ${isPast || isSun ? styles.disabled : ''}`}
                                                disabled={isPast || isSun}
                                                onClick={() => setFormData({ ...formData, date: isoDate, time: '' })}
                                            >
                                                {d}
                                            </button>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>
                        </div>

                        {formData.date && !isSunday && (
                            <div className={styles.formGroup}>
                                <label>Verfügbare Uhrzeiten am {new Date(formData.date).toLocaleDateString('de-DE')}</label>
                                <div className={styles.timeGrid}>
                                    {generateTimeSlots().map(time => {
                                        const isBooked = isSlotBooked(time);
                                        return (
                                            <button
                                                key={time}
                                                className={`${styles.timeSlot} ${formData.time === time ? styles.selected : ''} ${isBooked ? styles.disabled : ''}`}
                                                disabled={isBooked}
                                                onClick={() => setFormData({ ...formData, time })}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                    <small style={{ color: 'var(--color-muted)' }}>Geöffnet 8:00 - 19:00 Uhr</small>
                                </div>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button className="btn btn-outline" onClick={() => setStep(1)}>Zurück</button>
                            <button
                                className="btn btn-primary"
                                disabled={!isStep2Valid}
                                onClick={() => setStep(3)}
                            >
                                Nächster Schritt
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h2>Ihre Daten</h2>
                        <p>Wir benötigen Ihre Kontaktdaten für die Terminbestätigung.</p>

                        <div className={styles.formGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder=""
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder=""
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Telefon</label>
                            <input
                                type="tel"
                                className={styles.input}
                                placeholder=""
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className={styles.actions}>
                            <button className="btn btn-outline" onClick={() => setStep(2)}>Zurück</button>
                            <button
                                className="btn btn-primary"
                                disabled={!isStep3Valid || loading}
                                onClick={submitBooking}
                            >
                                {loading ? 'Wird gebucht...' : 'Termin bestätigen'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && result && (
                    <div className={styles.stepContent} style={{ textAlign: 'center' }}>
                        <h2 style={{ color: result.success ? 'green' : 'red' }}>
                            {result.success ? 'Erfolg!' : 'Fehler'}
                        </h2>
                        <p>{result.msg}</p>
                        {result.success && (
                            <p>Wir haben Ihnen eine Bestätigung gesendet.</p>
                        )}
                        <button className="btn btn-outline" onClick={() => window.location.href = '/'}>
                            Zur Startseite
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
