'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Wifi } from 'lucide-react';
import type { ReactNode } from 'react';

interface HeaderProps {
  mode?: 'landing' | 'send' | 'receive';
  title?: string;
  showBack?: boolean;
}

export default function Header({ mode = 'landing', title, showBack }: HeaderProps) {
  const isNotLanding = showBack || mode !== 'landing';

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-14 px-4 sm:px-6 flex items-center justify-between glass-strong border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        {isNotLanding && (
          <Link
            href="/"
            className="btn-ghost rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white no-underline"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="relative w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_18px_-2px_rgba(99,102,241,0.8)]">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight text-[15px]">
              <span className="gradient-text">QR</span>{' '}
              <span className="text-white">AirGap</span>
            </span>
            <span className="font-mono text-[10px] text-cyan-300/80 border border-cyan-400/20 rounded px-1.5 py-0.5 bg-cyan-400/5">
              v2.0 Ultra
            </span>
          </div>
        </Link>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-white/40">
        <Wifi className="w-3.5 h-3.5 text-emerald-400/70" />
        <span>airgap · isolated</span>
      </div>
    </header>
  );
}

export function AmbientBackground() {
  return (
    <>
      <div className="mesh" />
      <div className="mesh-violet" />
      <div className="grid-overlay" />
    </>
  );
}

export function Badge({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] font-medium text-white/70">
      <span className="text-cyan-300">{icon}</span>
      {children}
    </div>
  );
}
