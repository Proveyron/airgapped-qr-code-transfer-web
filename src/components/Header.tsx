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
      <div className={styles.left}>
        {showBack && (
          <Link href="/" className={styles.backBtn} aria-label="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
        )}
        <Link href="/" className={`${styles.logo} gradient-text`}>
          QR Transfer
        </Link>
      </div>
      {title && (
        <div className={styles.right}>
          {title}
        </div>
      )}
    </header>
  );
}
