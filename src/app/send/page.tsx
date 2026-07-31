'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import * as pako from 'pako';
import QRCode from 'qrcode';
import { Upload, File as FileIcon, X, Zap, Play, Pause, RotateCcw } from 'lucide-react';

const DENSITIES = [
  { label: '250B', name: 'Compact', value: 250 },
  { label: '500B', name: 'Standard', value: 500 },
  { label: '750B', name: 'Fast', value: 750 },
  { label: '1000B', name: 'Ultra', value: 1000 },
];

const encodeData = (index: number, inputBytes: Uint8Array): string => {
  let binary = '';
  const len = inputBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(inputBytes[i]);
  }
  return index + ',' + btoa(binary);
};

const bytesToHuman = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function SendPage() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedData, setCompressedData] = useState<Uint8Array | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [density, setDensity] = useState<number>(750); // Default Fast (750B)
  const [fps, setFps] = useState<number>(20); // Default 20 FPS (50ms)
  const [playing, setPlaying] = useState<boolean>(false);
  const [chunkIdx, setChunkIdx] = useState<number>(0);
  const [loop, setLoop] = useState<number>(1);
  const [dragging, setDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);

  playRef.current = playing;

  const total = compressedData ? Math.ceil(compressedData.length / density) : 0;
  const delay = Math.round(1000 / fps);

  const processFile = async (selectedFile: File) => {
    setLoading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const compressed = pako.gzip(new Uint8Array(buffer), { level: 9 });
      setFile(selectedFile);
      setCompressedData(compressed);
      setCompressedSize(compressed.length);
      setChunkIdx(0);
      setLoop(1);
      setPlaying(true);
    } catch (err) {
      console.error('Error compressing file:', err);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  // Render current chunk to Canvas
  const renderChunk = async (idx: number) => {
    if (!compressedData || !canvasRef.current || total === 0) return;

    let encodedStr = '';
    if (idx === -1) {
      // Metadata
      encodedStr = JSON.stringify({ name: file?.name, chunks: total });
    } else {
      const start = idx * density;
      const chunk = compressedData.subarray(start, start + density);
      encodedStr = encodeData(idx, chunk);
    }

    try {
      await QRCode.toCanvas(canvasRef.current, encodedStr, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.error('Error rendering QR to canvas:', err);
    }
  };

  // Main playback loop
  useEffect(() => {
    if (!playing || !compressedData || total === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let current = chunkIdx;
    let currentLoop = loop;

    const tick = async () => {
      if (!playRef.current) return;

      await renderChunk(current);

      let next = current + 1;
      if (next >= total) {
        next = 0;
        currentLoop += 1;
        setLoop(currentLoop);
      }

      current = next;
      setChunkIdx(next);

      if (playRef.current) {
        timerRef.current = setTimeout(tick, delay);
      }
    };

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, compressedData, density, fps]);

  const resetPlayback = () => {
    setChunkIdx(0);
    setLoop(1);
  };

  const clearFile = () => {
    setPlaying(false);
    setFile(null);
    setCompressedData(null);
    setCompressedSize(null);
    setChunkIdx(0);
    setLoop(1);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const progress = total > 0 ? ((chunkIdx + 1) / total) * 100 : 0;

  return (
    <div className="relative z-10 w-full min-h-screen flex flex-col">
      <Header mode="send" title="Send Mode" showBack={true} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-4 sm:pb-8 flex flex-col gap-3">
        {!compressedData ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`fade-up glass rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all flex-1 min-h-[320px] ${
              dragging
                ? 'border-indigo-400/50 shadow-[0_0_40px_-8px_rgba(99,102,241,0.6)]'
                : 'border-dashed border-white/15'
            }`}
          >
            <input type="file" className="hidden" onChange={onPick} />
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-cyan-500/10 flex items-center justify-center mb-4 transition-transform ${dragging ? 'scale-110' : ''}`}>
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-indigo-300" />
              )}
            </div>
            <p className="text-base font-semibold text-white/90">
              {loading ? 'Compressing with Gzip…' : 'Drop a file or click to select'}
            </p>
            <p className="text-xs text-white/40 mt-1.5">
              Auto-compressed with Gzip level 9 before streaming
            </p>
          </label>
        ) : (
          <>
            {/* File info card */}
            <div className="fade-up glass rounded-xl p-4 flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/25 to-cyan-500/10 flex items-center justify-center shrink-0">
                <FileIcon className="w-5 h-5 text-indigo-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{file?.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-mono">
                  <span className="text-white/45">{bytesToHuman(file?.size || 0)}</span>
                  {compressedSize !== null && (
                    <span className="text-emerald-300/90">{bytesToHuman(compressedSize)} gzip</span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300/90 truncate max-w-[140px]">
                    {file?.type || 'binary'}
                  </span>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="btn-ghost rounded-lg p-2 shrink-0 text-white/60 hover:text-white"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Chunk Density</span>
                  <span className="font-mono text-[11px] text-cyan-300/90">{total} chunks</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {DENSITIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDensity(d.value)}
                      className={`rounded-lg py-2 px-1 text-center transition-all border ${
                        density === d.value
                          ? 'bg-indigo-500/20 border-indigo-400/60 text-white shadow-[0_0_18px_-4px_rgba(99,102,241,0.8)]'
                          : 'bg-white/[0.02] border-white/8 text-white/55 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-semibold font-mono">{d.label}</div>
                      <div className="text-[9px] opacity-70">{d.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Speed Control</span>
                  <span className="font-mono text-[11px] text-cyan-300/90 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> {fps} FPS / {delay}ms
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="glow-slider w-full mt-3"
                />
                <div className="flex justify-between text-[10px] font-mono text-white/30 mt-2">
                  <span>1 FPS</span>
                  <span>30 FPS</span>
                </div>
              </div>
            </div>

            {/* QR Player */}
            <div className="fade-up glass rounded-2xl p-4 flex flex-col items-center shrink-0">
              <div className="relative cyber-ring rounded-2xl p-3 bg-white flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={320}
                  className="block rounded-lg"
                  style={{ width: 'min(38vh, 60vw, 280px)', height: 'min(38vh, 60vw, 280px)' }}
                />
                {!playing && total > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl backdrop-blur-[2px]">
                    <button
                      onClick={() => setPlaying(true)}
                      className="w-14 h-14 rounded-full btn-gradient flex items-center justify-center shadow-lg"
                      aria-label="Play"
                    >
                      <Play className="w-6 h-6 ml-0.5 text-white" />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full max-w-sm mt-4">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-white/60">Loop {loop} · Chunk {chunkIdx + 1} / {total}</span>
                  <span className="gradient-text font-bold">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2"
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {playing ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={resetPlayback}
                  className="btn-ghost rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Restart Loop
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
