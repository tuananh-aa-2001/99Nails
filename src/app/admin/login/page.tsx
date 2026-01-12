'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push('/admin');
                router.refresh();
            } else {
                setError('Ungültiges Passwort. Bitte versuchen Sie es erneut.');
            }
        } catch (err) {
            setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h1>Admin Login</h1>
                <p>Bitte geben Sie Ihr Passwort ein, um auf das Dashboard zuzugreifen.</p>
                <form onSubmit={handleLogin} className={styles.formWrapper}>
                    <input
                        type="password"
                        placeholder="Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={styles.input}
                        autoFocus
                    />
                    {error && <p className={styles.error}>{error}</p>}
                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                        {loading ? 'Wird angemeldet...' : 'Einloggen'}
                    </button>
                </form>
                <a href="/" className={styles.backLink}>Zurück zur Startseite</a>
            </div>
        </div>
    );
}
