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
  const [density, setDensity] = useState<number>(750);
  const [fps, setFps] = useState<number>(20);
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

  const renderChunk = async (idx: number) => {
    if (!compressedData || !canvasRef.current || total === 0) return;

    let encodedStr = '';
    if (idx === -1) {
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
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch (err) {
      console.error('Error rendering QR:', err);
    }
  };

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
    <div className="relative z-10 w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between">
      <Header mode="send" title="Send Mode" showBack={true} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-3 pt-14 pb-2 flex flex-col items-center justify-evenly gap-2 overflow-hidden">
        {!compressedData ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`fade-up glass rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all w-full max-h-[300px] flex-1 ${
              dragging ? 'border-indigo-400/50 shadow-[0_0_40px_-8px_rgba(99,102,241,0.6)]' : 'border-dashed border-white/15'
            }`}
          >
            <input type="file" className="hidden" onChange={onPick} />
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/25 to-cyan-500/10 flex items-center justify-center mb-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-indigo-300" />
              )}
            </div>
            <p className="text-sm font-semibold text-white/90">
              {loading ? 'Compressing with Gzip…' : 'Drop a file or click to select'}
            </p>
            <p className="text-[10px] text-white/40 mt-1">
              Auto-compressed level 9 before streaming
            </p>
          </label>
        ) : (
          <>
            {/* Compact File Info */}
            <div className="fade-up glass rounded-xl py-2 px-3 flex items-center gap-3 w-full shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/25 to-cyan-500/10 flex items-center justify-center shrink-0">
                <FileIcon className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{file?.name}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-white/45">{bytesToHuman(file?.size || 0)}</span>
                  {compressedSize !== null && <span className="text-emerald-300">{bytesToHuman(compressedSize)} gzip</span>}
                </div>
              </div>
              <button onClick={clearFile} className="btn-ghost rounded-lg p-1.5 shrink-0 text-white/60 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2 w-full shrink-0">
              <div className="glass rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className="font-medium text-white/60">Density</span>
                  <span className="font-mono text-cyan-300">{total} chunks</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {DENSITIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDensity(d.value)}
                      className={`rounded-md py-1 text-center transition-all border ${
                        density === d.value
                          ? 'bg-indigo-500/20 border-indigo-400/60 text-white shadow-[0_0_12px_-3px_rgba(99,102,241,0.8)]'
                          : 'bg-white/[0.02] border-white/8 text-white/55'
                      }`}
                    >
                      <div className="text-[10px] font-semibold font-mono">{d.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className="font-medium text-white/60">Speed</span>
                  <span className="font-mono text-cyan-300 flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> {fps} FPS
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="glow-slider w-full mt-1.5"
                />
              </div>
            </div>

            {/* QR Player */}
            <div className="fade-up glass rounded-xl p-3 flex flex-col items-center w-full shrink-0">
              <div className="relative cyber-ring rounded-xl p-2 bg-white flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={320}
                  className="block rounded-lg"
                  style={{ width: 'min(28vh, 50vw, 220px)', height: 'min(28vh, 50vw, 220px)' }}
                />
                {!playing && total > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                    <button
                      onClick={() => setPlaying(true)}
                      className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center shadow-lg"
                    >
                      <Play className="w-5 h-5 ml-0.5 text-white" />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full max-w-xs mt-2">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-white/60">L{loop} · {chunkIdx + 1}/{total}</span>
                  <span className="gradient-text font-bold">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => setPlaying((p) => !p)} className="btn-gradient rounded-lg px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {playing ? 'Pause' : 'Play'}
                </button>
                <button onClick={resetPlayback} className="btn-ghost rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Restart
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
