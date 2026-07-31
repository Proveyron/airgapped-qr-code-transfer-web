import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.bgElements}>
        <div className={styles.glow}></div>
      </div>
      
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className="gradient-text">QR Transfer</span>
        </div>
        <div className={styles.badge}>v1.0</div>
      </header>

      <div className={styles.content}>
        <h1 className={`${styles.heroTitle} animate-fade-in`}>
          Transfer Files<br />
          <span className="gradient-text">Through the Air</span>
        </h1>
        
        <p className={`${styles.heroSubtitle} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
          Send any file between devices using QR codes — no internet, no cables, no servers.
        </p>

        <div className={styles.cardsContainer}>
          <div className={`glass-card ${styles.card} ${styles.card1} animate-fade-in`}>
            <div className={styles.iconWrapper}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Send File</h2>
            <p className={styles.cardDesc}>
              Pick a file and generate animated QR codes for the receiver to scan.
            </p>
            <Link href="/send" className="btn-primary" style={{ width: '100%' }}>
              Start Sending
            </Link>
          </div>

          <div className={`glass-card ${styles.card} ${styles.card2} animate-fade-in`}>
            <div className={styles.iconWrapper}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                <circle cx="12" cy="13" r="3"></circle>
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Receive File</h2>
            <p className={styles.cardDesc}>
              Use your camera to scan QR codes and reconstruct the original file.
            </p>
            <Link href="/receive" className="btn-primary" style={{ width: '100%' }}>
              Start Receiving
            </Link>
          </div>
        </div>

        <div className={`${styles.features} animate-fade-in`} style={{ animationDelay: '0.4s' }}>
          <span className={styles.feature}>🔒 No Internet Required</span>
          <span className={styles.feature}>📱 Works on Any Device</span>
          <span className={styles.feature}>⚡ Instant Transfer</span>
        </div>
      </div>
    </main>
  );
}
