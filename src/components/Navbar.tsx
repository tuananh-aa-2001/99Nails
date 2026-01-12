import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.nav}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo}>
                    LCM Nails
                </Link>
                <div className={styles.links}>
                    <Link href="/">Startseite</Link>
                    <Link href="/book">Buchen</Link>
                    <Link href="/availability">Verfügbarkeit</Link>
                    <Link href="/manage">Meine Termine</Link>
                    <Link href="/admin" style={{ opacity: 1.0 }}>Anmelden</Link>
                </div>
            </div>
        </nav>
    );
}
