import Link from 'next/link';
import Header, { Badge } from '@/components/Header';
import { Upload, Camera, ShieldCheck, Smartphone, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative z-10 w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between">
      <Header mode="landing" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-14 pb-2 flex flex-col items-center justify-evenly gap-2 overflow-hidden">
        {/* Hero */}
        <div className="fade-up text-center shrink-0">
          <div className="inline-flex items-center gap-1.5 mb-1.5 px-2.5 py-1 rounded-full glass text-[10px] font-mono text-cyan-300/90">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            SECURE · OFFLINE · ZERO TRACE
          </div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            Airgapped Data Bridge
          </h1>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight mt-0.5">
            <span className="gradient-text">Through the Air</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/55 max-w-md mx-auto leading-normal">
            Zero network file sharing via high-speed animated QR code streams.
          </p>
        </div>

        {/* Badges */}
        <div className="fade-up flex flex-wrap items-center justify-center gap-2 shrink-0" style={{ animationDelay: '0.08s' }}>
          <Badge icon={<ShieldCheck className="w-3.5 h-3.5" />}>100% Offline</Badge>
          <Badge icon={<Smartphone className="w-3.5 h-3.5" />}>Cross-Device</Badge>
          <Badge icon={<Zap className="w-3.5 h-3.5" />}>Up to 1000B/QR</Badge>
        </div>

        {/* Cards */}
        <div className="fade-up grid grid-cols-2 gap-3 w-full max-w-xl shrink-0" style={{ animationDelay: '0.16s' }}>
          <Link
            href="/send"
            className="group glass rounded-xl p-3.5 sm:p-5 text-left transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px] sm:min-h-[180px] group-hover:shadow-[0_0_40px_-8px_rgba(99,102,241,0.7)] group-hover:border-indigo-400/30 no-underline"
          >
            <div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500/30 to-indigo-500/5 text-indigo-300 group-hover:from-indigo-500/40 flex items-center justify-center mb-2 transition-all">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Send Mode</h2>
              <p className="text-[10px] sm:text-xs text-white/50 mt-0.5">Stream QR Chunks</p>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 btn-gradient rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-medium self-start">
              Start Sending <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <Link
            href="/receive"
            className="group glass rounded-xl p-3.5 sm:p-5 text-left transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px] sm:min-h-[180px] group-hover:shadow-[0_0_40px_-8px_rgba(6,182,212,0.7)] group-hover:border-cyan-400/30 no-underline"
          >
            <div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-cyan-500/5 text-cyan-300 group-hover:from-cyan-500/40 flex items-center justify-center mb-2 transition-all">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Receive Mode</h2>
              <p className="text-[10px] sm:text-xs text-white/50 mt-0.5">Scan & Reconstruct</p>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 btn-gradient rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-medium self-start">
              Start Receiving <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>

        <div className="text-center text-[9px] sm:text-[10px] font-mono text-white/25 shrink-0">
          No data leaves this device. No servers, no network, no trace.
        </div>
      </main>
    </div>
  );
}
