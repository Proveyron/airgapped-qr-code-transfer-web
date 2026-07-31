import Link from 'next/link';
import Header, { Badge } from '@/components/Header';
import { Upload, Camera, ShieldCheck, Smartphone, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative z-10 h-full w-full overflow-hidden min-h-screen flex flex-col">
      <Header mode="landing" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-20 pb-10 flex flex-col items-center justify-center gap-6 sm:gap-8">
        {/* Hero */}
        <div className="fade-up text-center shrink-0">
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-3 py-1.5 rounded-full glass text-[10px] sm:text-[11px] font-mono text-cyan-300/90">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            SECURE · OFFLINE · ZERO TRACE
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Airgapped Data Bridge
          </h1>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.1] mt-1">
            <span className="gradient-text">Through the Air</span>
          </h1>
          <p className="mt-3 text-xs sm:text-base lg:text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
            Zero network file sharing via high-speed animated QR code streams.
          </p>
        </div>

        {/* Badges */}
        <div className="fade-up flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 shrink-0" style={{ animationDelay: '0.08s' }}>
          <Badge icon={<ShieldCheck className="w-3.5 h-3.5" />}>100% Offline</Badge>
          <Badge icon={<Smartphone className="w-3.5 h-3.5" />}>Cross-Device</Badge>
          <Badge icon={<Zap className="w-3.5 h-3.5" />}>Up to 1000B/QR</Badge>
        </div>

        {/* Cards */}
        <div className="fade-up grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl" style={{ animationDelay: '0.16s' }}>
          <Link
            href="/send"
            className="group glass rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 flex flex-col h-full min-h-[220px] group-hover:shadow-[0_0_50px_-10px_rgba(99,102,241,0.7)] group-hover:border-indigo-400/30 no-underline"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/5 text-indigo-300 group-hover:from-indigo-500/40 flex items-center justify-center mb-4 transition-all shrink-0">
              <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white shrink-0">Send Mode</h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1.5 shrink-0">Compress & Stream QR Chunks</p>
            <div className="flex-1 min-h-0" />
            <div className="mt-4 inline-flex items-center gap-2 btn-gradient rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium self-start shrink-0">
              Start Sending
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <Link
            href="/receive"
            className="group glass rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 flex flex-col h-full min-h-[220px] group-hover:shadow-[0_0_50px_-10px_rgba(6,182,212,0.7)] group-hover:border-cyan-400/30 no-underline"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-500/5 text-cyan-300 group-hover:from-cyan-500/40 flex items-center justify-center mb-4 transition-all shrink-0">
              <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white shrink-0">Receive Mode</h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1.5 shrink-0">Scan & Reconstruct Files</p>
            <div className="flex-1 min-h-0" />
            <div className="mt-4 inline-flex items-center gap-2 btn-gradient rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium self-start shrink-0">
              Start Receiving
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>

        <div className="text-center text-[11px] font-mono text-white/25 shrink-0 mt-4">
          No data leaves this device. No servers, no network, no trace.
        </div>
      </main>
    </div>
  );
}
