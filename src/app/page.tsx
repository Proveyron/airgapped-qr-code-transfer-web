import Link from 'next/link';
import Header, { Badge } from '@/components/Header';
import { Upload, Camera, ShieldCheck, Smartphone, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-between">
      <Header mode="landing" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-16 sm:pt-20 pb-4 sm:pb-8 flex flex-col items-center justify-center gap-3 sm:gap-6">
        {/* Hero */}
        <div className="fade-up text-center shrink-0">
          <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full glass text-[10px] sm:text-[11px] font-mono text-cyan-300/90">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            SECURE · OFFLINE · ZERO TRACE
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            Airgapped Data Bridge
          </h1>
          <h1 className="text-xl xs:text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mt-0.5">
            <span className="gradient-text">Through the Air</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm lg:text-base text-white/55 max-w-lg mx-auto leading-relaxed">
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
        <div className="fade-up grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-2xl" style={{ animationDelay: '0.16s' }}>
          <Link
            href="/send"
            className="group glass rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 flex flex-col h-full min-h-[170px] sm:min-h-[210px] group-hover:shadow-[0_0_50px_-10px_rgba(99,102,241,0.7)] group-hover:border-indigo-400/30 no-underline"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/5 text-indigo-300 group-hover:from-indigo-500/40 flex items-center justify-center mb-2 sm:mb-4 transition-all shrink-0">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold text-white shrink-0">Send Mode</h2>
            <p className="text-[11px] sm:text-xs text-white/50 mt-1 shrink-0">Compress & Stream QR</p>
            <div className="flex-1 min-h-0" />
            <div className="mt-3 inline-flex items-center gap-1.5 btn-gradient rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-medium self-start shrink-0">
              Start Sending
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <Link
            href="/receive"
            className="group glass rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 flex flex-col h-full min-h-[170px] sm:min-h-[210px] group-hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.7)] group-hover:border-cyan-400/30 no-underline"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-500/5 text-cyan-300 group-hover:from-cyan-500/40 flex items-center justify-center mb-2 sm:mb-4 transition-all shrink-0">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold text-white shrink-0">Receive Mode</h2>
            <p className="text-[11px] sm:text-xs text-white/50 mt-1 shrink-0">Scan & Reconstruct</p>
            <div className="flex-1 min-h-0" />
            <div className="mt-3 inline-flex items-center gap-1.5 btn-gradient rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-medium self-start shrink-0">
              Start Receiving
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>

        <div className="text-center text-[10px] font-mono text-white/25 shrink-0 mt-1">
          No data leaves this device. No servers, no network, no trace.
        </div>
      </main>
    </div>
  );
}
