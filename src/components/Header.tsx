'use client';

import Link from 'next/link';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title, showBack }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          {showBack && (
            <Link href="/" className={styles.backButton} aria-label="Back to home">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <Link href="/" className={styles.logoLink}>
            <span className="gradient-text">QR AirGap</span>
          </Link>
          <span className={styles.badge}>v2.0 Ultra</span>
        </div>

        {title && (
          <div className={styles.right}>
            <span className={styles.pageTitle}>{title}</span>
          </div>
        )}
      </div>
    </header>
  );
}
