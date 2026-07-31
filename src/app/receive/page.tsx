'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import * as pako from 'pako';
import { Camera, Square, Trash2, CheckCircle2, Download, ScanLine } from 'lucide-react';

interface ReceiveState {
  name: string | null;
  size: number;
  total: number;
  received: Map<number, Uint8Array>;
}

const initialState: ReceiveState = {
  name: null,
  size: 0,
  total: 0,
  received: new Map(),
};

const bytesToHuman = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const decodeData = (inputString: string): { index: number; data: Uint8Array } | null => {
  const commaIndex = inputString.indexOf(',');
  if (commaIndex === -1) return null;
  const indexStr = inputString.substring(0, commaIndex);
  const base64Str = inputString.substring(commaIndex + 1);
  try {
    const binaryString = atob(base64Str);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return {
      index: parseInt(indexStr, 10),
      data: bytes,
    };
  } catch (e) {
    return null;
  }
};

export default function ReceivePage() {
  const [state, setState] = useState<ReceiveState>(initialState);
  const [scanning, setScanning] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const zbarRef = useRef<any>(null);

  const stateRef = useRef<ReceiveState>(state);
  stateRef.current = state;

  const syncState = useCallback((fn: (prev: ReceiveState) => ReceiveState) => {
    setState((prev) => {
      const next = fn(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  // Process decoded QR text
  const processDecodedText = useCallback((text: string) => {
    try {
      if (text.includes('"chunks"')) {
        const meta = JSON.parse(text);
        if (meta.name && meta.chunks) {
          syncState((prev) => {
            if (prev.name !== meta.name || prev.total !== meta.chunks) {
              return {
                name: meta.name,
                size: prev.size,
                total: meta.chunks,
                received: new Map(),
              };
            }
            return prev;
          });
        }
      } else if (text.includes(',')) {
        const decoded = decodeData(text);
        if (decoded && !isNaN(decoded.index)) {
          syncState((prev) => {
            if (prev.received.has(decoded.index)) return prev;
            const nextMap = new Map(prev.received);
            nextMap.set(decoded.index, decoded.data);
            return {
              ...prev,
              received: nextMap,
            };
          });
        }
      }
    } catch (e) {
      console.error('Scan parse error:', e);
    }
  }, [syncState]);

  // Main scan loop using zbar-wasm / jsQR / video canvas frame scanning
  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      if (scanning) {
        rafRef.current = requestAnimationFrame(scanFrame);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        if (!zbarRef.current && (window as any).zbarWasm) {
          zbarRef.current = (window as any).zbarWasm;
        }

        if (zbarRef.current) {
          const symbols = await zbarRef.current.scanImageData(imgData);
          if (symbols && symbols.length > 0) {
            const text = symbols[0].decode();
            if (text) processDecodedText(text);
          }
        }
      } catch (e) {
        // Continue scanning silently
      }
    }

    if (scanning) {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  }, [scanning, processDecodedText]);

  // Handle completion assembly
  useEffect(() => {
    const { total, received, name } = state;
    if (total > 0 && received.size === total && !done) {
      try {
        let totalLen = 0;
        for (let i = 0; i < total; i++) {
          const chunk = received.get(i);
          if (!chunk) throw new Error(`Missing chunk ${i}`);
          totalLen += chunk.length;
        }

        const fullCompressed = new Uint8Array(totalLen);
        let offset = 0;
        for (let i = 0; i < total; i++) {
          const chunk = received.get(i)!;
          fullCompressed.set(chunk, offset);
          offset += chunk.length;
        }

        const decompressed = pako.inflate(fullCompressed);
        const blob = new Blob([decompressed]);
        const url = URL.createObjectURL(blob);

        syncState((prev) => ({ ...prev, size: decompressed.length }));
        setDownloadUrl(url);
        setDone(true);
        setScanning(false);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = name || 'received-file';
        a.click();
      } catch (e) {
        console.error('File assembly error:', e);
        setError('Error reconstructing file buffer.');
      }
    }
  }, [state, done, syncState]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      // Inject zbar-wasm script dynamically if needed
      if (!(window as any).zbarWasm) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@undecaf/zbar-wasm@latest/dist/index.js';
        document.body.appendChild(script);
        await new Promise((r) => setTimeout(r, 800));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setScanning(true);
    } catch {
      try {
        // Fallback to default/front camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setScanning(true);
      } catch {
        setError('Camera access denied or unavailable.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    setScanning(false);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (scanning) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [scanning, scanFrame]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const purge = () => {
    stopCamera();
    syncState(() => initialState);
    setDone(false);
    setDownloadUrl(null);
    setError(null);
  };

  const download = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = state.name || 'received-file';
    a.click();
  };

  const receivedCount = state.received.size;
  const progress = state.total ? (receivedCount / state.total) * 100 : 0;

  return (
    <div className="relative z-10 w-full min-h-screen flex flex-col">
      <Header mode="receive" title="Receive Mode" showBack={true} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-4 sm:pb-8 flex flex-col gap-3">
        {/* Scanner */}
        <div className="fade-up glass rounded-2xl p-4 flex flex-col items-center shrink-0">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Camera Scanner</span>
            <span className={`font-mono text-xs flex items-center gap-2 ${scanning ? 'text-emerald-300' : 'text-white/40'}`}>
              <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
              {scanning ? 'LIVE 60FPS' : 'IDLE'}
            </span>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden bg-black/80 border border-white/10 shrink-0 flex items-center justify-center"
            style={{ width: 'min(42vh, 75vw, 320px)', height: 'min(42vh, 75vw, 320px)' }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${scanning ? 'opacity-90' : 'opacity-30'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            <Reticle className="top-3 left-3" rot="rotate-0" />
            <Reticle className="top-3 right-3" rot="rotate-90" />
            <Reticle className="bottom-3 left-3" rot="-rotate-90" />
            <Reticle className="bottom-3 right-3" rot="rotate-180" />

            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="radar-sweep w-[80%] h-[80%] rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.25) 40deg, transparent 60deg)',
                  }}
                />
              </div>
            )}

            {scanning && (
              <div className="absolute inset-x-0 scanline h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_2px_rgba(6,182,212,0.7)]" />
            )}

            {!scanning && !done && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <ScanLine className="w-8 h-8 text-cyan-300/80" />
                <p className="text-xs text-white/60">
                  {error ? error : 'Point your camera at a streaming QR code'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
            {!scanning ? (
              <button
                onClick={startCamera}
                className="btn-gradient rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Start Scanning
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="btn-ghost rounded-xl px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2"
              >
                <Square className="w-4 h-4" /> Pause
              </button>
            )}
            <button
              onClick={purge}
              className="btn-ghost rounded-xl px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 text-rose-300/90 hover:text-rose-200"
            >
              <Trash2 className="w-4 h-4" /> Stop & Purge Buffer
            </button>
          </div>
        </div>

        {/* Chunk grid */}
        {state.total > 0 && (
          <div className="fade-up glass rounded-xl p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Chunk Matrix Grid</span>
              <span className="font-mono text-xs text-cyan-300/90">
                {receivedCount} / {state.total} · {progress.toFixed(0)}%
              </span>
            </div>
            <div
              className="grid gap-1 overflow-hidden p-2 bg-black/40 rounded-lg border border-white/5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(10px, 1fr))', maxHeight: '120px' }}
            >
              {Array.from({ length: Math.min(state.total, 400) }).map((_, i) => {
                const got = state.received.has(i);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-[3px] transition-all ${
                      got ? 'bg-emerald-400 led-on' : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>
            {state.total > 400 && (
              <p className="text-[10px] font-mono text-white/30 mt-1.5 text-center">
                showing first 400 of {state.total} chunks
              </p>
            )}
          </div>
        )}

        {/* Completion card */}
        {done && (
          <div className="fade-up glass-strong rounded-2xl p-6 flex flex-col items-center text-center pop shrink-0">
            <div className="relative">
              <Confetti />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/10 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-9 h-9 text-emerald-300" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mt-4">Transfer Complete</h3>
            <p className="text-xs font-mono text-white/60 mt-1 truncate max-w-full">
              {state.name} · {bytesToHuman(state.size)}
            </p>
            <button
              onClick={download}
              className="btn-gradient rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 mt-4"
            >
              <Download className="w-4 h-4" /> Download File
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Reticle({ className, rot }: { className: string; rot: string }) {
  return (
    <div className={`absolute w-6 h-6 ${className}`}>
      <div className={`absolute top-0 left-0 w-3 h-0.5 bg-cyan-400/80 ${rot}`} />
      <div className={`absolute top-0 left-0 w-0.5 h-3 bg-cyan-400/80 ${rot}`} />
    </div>
  );
}

function Confetti() {
  const colors = ['#6366f1', '#06b6d4', '#a855f7', '#34d399', '#fbbf24'];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece absolute w-1.5 h-1.5 rounded-sm"
          style={{
            left: `${50 + (Math.random() * 60 - 30)}%`,
            top: '40%',
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}
