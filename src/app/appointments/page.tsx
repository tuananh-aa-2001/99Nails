'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function MyAppointments() {
    const [email, setEmail] = useState('');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/appointments/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            setAppointments(data);
            setSearched(true);
        } catch (err) {
            alert('Error fetching appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const res = await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' });
            if (res.ok) {
                alert('Appointment cancelled');
                // Refresh list
                handleSearch({ preventDefault: () => { } } as any);
            } else {
                alert('Failed to cancel');
            }
        } catch (err) {
            alert('Error cancelling');
        }
    };

    return (
        <div className="container" style={{ padding: '40px 16px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>My Appointments</h1>

            <div className={styles.searchBox}>
                <form onSubmit={handleSearch}>
                    <label>Enter your email to find your bookings:</label>
                    <div className={styles.inputGroup}>
                        <input
                            type="email"
                            required
                            placeholder="email@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className={styles.input}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Searching...' : 'Find'}
                        </button>
                    </div>
                </form>
            </div>

            {searched && (
                <div className={styles.results}>
                    {appointments.length === 0 ? (
                        <p style={{ textAlign: 'center' }}>No upcoming appointments found for this email.</p>
                    ) : (
                        <div className={styles.grid}>
                            {appointments.map(app => (
                                <div key={app.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.date}>
                                            {new Date(app.startTime).toLocaleDateString()} at {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={styles.status}>{app.status}</span>
                                    </div>
                                    <h3>{app.serviceName}</h3>
                                    {app.extras && <p className={styles.extras}>Extras: {app.extras}</p>}

                                    {app.status !== 'CANCELLED' && (
                                        <button
                                            className="btn btn-outline"
                                            style={{ marginTop: '16px', width: '100%', borderColor: 'red', color: 'red' }}
                                            onClick={() => handleCancel(app.id)}
                                        >
                                            Cancel Appointment
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
