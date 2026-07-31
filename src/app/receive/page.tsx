'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import * as pako from 'pako';
import jsQR from 'jsqr';
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
    return { index: parseInt(indexStr, 10), data: bytes };
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

  const stateRef = useRef<ReceiveState>(state);
  stateRef.current = state;

  const syncState = useCallback((fn: (prev: ReceiveState) => ReceiveState) => {
    setState((prev) => {
      const next = fn(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  const processDecodedText = useCallback((text: string) => {
    try {
      if (text.includes('"chunks"')) {
        const meta = JSON.parse(text);
        if (meta.name && meta.chunks) {
          syncState((prev) => {
            if (prev.name !== meta.name || prev.total !== meta.chunks) {
              return { name: meta.name, size: prev.size, total: meta.chunks, received: new Map() };
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
            return { ...prev, received: nextMap };
          });
        }
      }
    } catch (e) {
      console.error('Scan parse error:', e);
    }
  }, [syncState]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });

        if (code && code.data) {
          processDecodedText(code.data);
        }
      }
    }

    if (scanning) {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  }, [scanning, processDecodedText]);

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

        const a = document.createElement('a');
        a.href = url;
        a.download = name || 'received-file';
        a.click();
      } catch (e) {
        console.error('Assembly error:', e);
        setError('Error reconstructing file.');
      }
    }
  }, [state, done, syncState]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
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
    return () => { stopCamera(); };
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
    <div className="relative z-10 w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between">
      <Header mode="receive" title="Receive Mode" showBack={true} />

      <main className="flex-1 w-full max-w-xl mx-auto px-3 pt-14 pb-2 flex flex-col items-center justify-evenly gap-2 overflow-hidden">
        {/* Scanner */}
        <div className="fade-up glass rounded-xl p-3 flex flex-col items-center w-full shrink-0">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Scanner</span>
            <span className={`font-mono text-[10px] flex items-center gap-1.5 ${scanning ? 'text-emerald-300' : 'text-white/40'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
              {scanning ? 'LIVE' : 'IDLE'}
            </span>
          </div>

          <div
            className="relative rounded-xl overflow-hidden bg-black/80 border border-white/10 shrink-0 flex items-center justify-center"
            style={{ width: 'min(30vh, 55vw, 240px)', height: 'min(30vh, 55vw, 240px)' }}
          >
            <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${scanning ? 'opacity-90' : 'opacity-30'}`} />
            <canvas ref={canvasRef} className="hidden" />

            <Reticle className="top-2 left-2" rot="rotate-0" />
            <Reticle className="top-2 right-2" rot="rotate-90" />
            <Reticle className="bottom-2 left-2" rot="-rotate-90" />
            <Reticle className="bottom-2 right-2" rot="rotate-180" />

            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="radar-sweep w-[80%] h-[80%] rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.25) 40deg, transparent 60deg)' }} />
              </div>
            )}

            {scanning && (
              <div className="absolute inset-x-0 scanline h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_2px_rgba(6,182,212,0.7)]" />
            )}

            {!scanning && !done && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
                <ScanLine className="w-6 h-6 text-cyan-300/80" />
                <p className="text-[10px] text-white/60">
                  {error ? error : 'Point camera at QR code'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            {!scanning ? (
              <button onClick={startCamera} className="btn-gradient rounded-lg px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Start Scanning
              </button>
            ) : (
              <button onClick={stopCamera} className="btn-ghost rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5" /> Pause
              </button>
            )}
            <button onClick={purge} className="btn-ghost rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 text-rose-300/90">
              <Trash2 className="w-3.5 h-3.5" /> Purge Buffer
            </button>
          </div>
        </div>

        {/* Chunk Grid */}
        {state.total > 0 && (
          <div className="fade-up glass rounded-xl p-3 w-full shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Chunk Matrix</span>
              <span className="font-mono text-[10px] text-cyan-300">{receivedCount} / {state.total} · {progress.toFixed(0)}%</span>
            </div>
            <div className="grid gap-0.5 overflow-hidden p-1.5 bg-black/40 rounded-lg border border-white/5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(8px, 1fr))', maxHeight: '70px' }}>
              {Array.from({ length: Math.min(state.total, 300) }).map((_, i) => {
                const got = state.received.has(i);
                return <div key={i} className={`aspect-square rounded-[2px] ${got ? 'bg-emerald-400 led-on' : 'bg-white/10'}`} />;
              })}
            </div>
          </div>
        )}

        {/* Completion */}
        {done && (
          <div className="fade-up glass-strong rounded-xl p-4 flex flex-col items-center text-center pop w-full shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/10 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-emerald-300" />
            </div>
            <h3 className="text-sm font-bold text-white mt-2">Transfer Complete</h3>
            <p className="text-[10px] font-mono text-white/60 mt-0.5 truncate max-w-full">{state.name} · {bytesToHuman(state.size)}</p>
            <button onClick={download} className="btn-gradient rounded-lg px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 mt-2">
              <Download className="w-3.5 h-3.5" /> Download File
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Reticle({ className, rot }: { className: string; rot: string }) {
  return (
    <div className={`absolute w-4 h-4 ${className}`}>
      <div className={`absolute top-0 left-0 w-2.5 h-0.5 bg-cyan-400/80 ${rot}`} />
      <div className={`absolute top-0 left-0 w-0.5 h-2.5 bg-cyan-400/80 ${rot}`} />
    </div>
  );
}
