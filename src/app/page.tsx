import styles from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';

async function getServices() {
    // Check if running on server, we can import prisma directly or fetch absolute URL.
    // For simplicity in server component, we can use fetch('http://localhost:3000/api...') but that requires absolute URL.
    // OR just import the logic if we want, but better to keep separation.
    // For build time, localhost fetch might fail.
    // We will just hardcode services here for the Landing Page or fetch client side.
    // Server Component fetch usually needs full URL.

    return [
        { id: 'manicure', name: 'Klassische Maniküre', desc: 'Nagelfomung, Nagelhautpflege, Massage und Lackierung.' },
        { id: 'pedicure', name: 'Pediküre', desc: 'Fußbad, Nagelformung, Nagelhautpflege, Massage und Lackierung.' },
        { id: 'fullset', name: 'Acryl Neumodellage', desc: 'Künstliche Nagelverlängerung mit strapazierfhigem Acryl.' },
    ];
}

export default async function Home() {
    const services = await getServices();

    return (
        <>
            <main className={styles.main}>
                <section className={styles.hero}>
                    <div className={`${styles.heroContainer} container`}>
                        <div className={styles.heroContent}>
                            <h1 className={styles.title}>Schönheit an Ihren Fingerspitzen</h1>
                            <p className={styles.subtitle}>Entspannen, verjüngen und glänzen Sie mit unseren erstklassigen Nagelservices bei LCM Nails.</p>
                            <div className={styles.heroButtons}>
                                <Link href="/book" className="btn btn-primary">Termin buchen</Link>
                                <Link href="/availability" className="btn btn-secondary" style={{ marginLeft: '10px' }}>Verfügbarkeit prüfen</Link>
                                <Link href="/manage" className="btn btn-outline" style={{ marginLeft: '10px' }}>Termin verwalten</Link>
                            </div>
                        </div>
                        <div className={styles.heroImageWrapper}>
                            <Image
                                src="/nail-image.jpg"
                                alt="LCM Nails Design"
                                width={600}
                                height={400}
                                className={styles.heroImage}
                                priority
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.about}>
                    <div className="container">
                        <div className={styles.aboutContent}>
                            <h2>Über uns</h2>
                            <p>
                                Herzlich willkommen bei LCM Nails, Ihrem professionellen Nagelstudio im Herzen von Bad Driburg.
                                Unser modernes Studio bietet Ihnen eine entspannende Atmosphäre, in der Sie sich rundum wohlfühlen
                                und verwöhnen lassen können. Mit jahrelanger Erfahrung und einem Auge fürs Detail setzen wir
                                Ihre Wünsche für perfekte Nägel und makellose Hände um.
                            </p>
                            <p>
                                Unser umfangreiches Leistungsangebot umfasst klassische Maniküre und Pediküre, Gel- und Acrylnägel,
                                sowie trendige Nageldesigns. Ob dezente Eleganz, natürliche Looks oder kreative Kunstwerke –
                                bei LCM Nails verwandeln wir Ihre Nägel in kleine Meisterwerke.
                            </p>
                        </div>
                    </div>
                </section>

                <section className={styles.services}>
                    <div className="container">
                        <h2>Unsere Services</h2>
                        <div className={styles.grid}>
                            {services.map(s => (
                                <div key={s.id} className={styles.card}>
                                    <h3>{s.name}</h3>
                                    <p>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className={styles.footer}>
                    <div className="container">
                        <div className={styles.footerGrid}>
                            <div className={styles.footerInfo}>
                                <h3>LCM Nails</h3>
                                <p>Ihr Partner für schöne Nägel in Bad Driburg.</p>
                            </div>
                            <div className={styles.footerContact}>
                                <h4>Kontakt</h4>
                                <p>📍 Am Hellweg 8A, 33014 Bad Driburg</p>
                                <p>📞 +49 (0) 123 4567890</p>
                            </div>
                            <div className={styles.footerHours}>
                                <h4>Öffnungszeiten</h4>
                                <p>Mo - Sa: 08:30 - 19:00 Uhr</p>
                                <p>So: Geschlossen</p>
                            </div>
                        </div>
                        <div className={styles.copyright}>
                            <p>&copy; {new Date().getFullYear()} LCM Nails. Alle Rechte vorbehalten.</p>
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}
