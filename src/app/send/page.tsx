'use client';

import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import * as pako from 'pako';
import QRCode from 'qrcode';
import styles from './send.module.css';

const CHUNK_SIZE = 250;

const encodeData = (index: number, inputBytes: Uint8Array): string => {
  let encodedString = String.fromCharCode.apply(null, Array.from(inputBytes));
  let utf8Encoder = new TextEncoder();
  let utf8Bytes = utf8Encoder.encode(encodedString);
  let encodedData = btoa(String.fromCharCode.apply(null, Array.from(utf8Bytes)));
  return index + ',' + encodedData;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function SendPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'transferring' | 'done'>('idle');
  const [currentChunk, setCurrentChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [transferSpeed, setTransferSpeed] = useState<number>(200);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedData, setCompressedData] = useState<Uint8Array | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transferringRef = useRef<boolean>(false);

  const processFile = async (selectedFile: File) => {
    try {
      const buffer = await selectedFile.arrayBuffer();
      const compressed = pako.gzip(buffer, { level: 9 });
      
      setFile(selectedFile);
      setCompressedData(compressed);
      setCompressedSize(compressed.length);
      setTotalChunks(Math.ceil(compressed.length / CHUNK_SIZE));
      setStatus('ready');
    } catch (err) {
      console.error('Error compressing file:', err);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const startTransfer = async () => {
    if (!file || !compressedData) return;
    
    setStatus('transferring');
    transferringRef.current = true;
    setCurrentChunk(0);

    // Metadata QR
    const metadata = JSON.stringify({ name: file.name, chunks: totalChunks });
    const metaQrUrl = await QRCode.toDataURL(metadata, { width: 400, margin: 1, errorCorrectionLevel: 'M' });
    setQrDataUrl(metaQrUrl);

    // Wait for metadata to be scanned
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Loop through chunks
    for (let i = 0; i < totalChunks; i++) {
      if (!transferringRef.current) break;

      setCurrentChunk(i);
      const start = i * CHUNK_SIZE;
      const chunk = compressedData.subarray(start, start + CHUNK_SIZE);
      const encoded = encodeData(i, chunk);
      
      const qrUrl = await QRCode.toDataURL(encoded, { width: 400, margin: 1, errorCorrectionLevel: 'M' });
      setQrDataUrl(qrUrl);

      await new Promise(resolve => setTimeout(resolve, transferSpeed));
    }

    if (transferringRef.current) {
      setStatus('done');
      transferringRef.current = false;
    }
  };

  const stopTransfer = () => {
    transferringRef.current = false;
    setStatus('ready');
  };

  const reset = () => {
    setFile(null);
    setCompressedData(null);
    setStatus('idle');
  };

  return (
    <div className={styles.container}>
      <Header title="Send Mode" showBack={true} />

      <main className={styles.main}>
        <div className={styles.content}>
          {status === 'idle' && (
            <div 
              className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className={styles.dropIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className={styles.dropText}>Drag & drop a file here</h3>
              <p className={styles.dropSubtext}>or click to browse</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileSelect} 
                style={{ display: 'none' }} 
              />
            </div>
          )}

          {status === 'ready' && file && (
            <>
              <div className={styles.fileInfo}>
                <div className={styles.fileDetail}>
                  <span className={styles.fileDetailLabel}>File Name</span>
                  <span className={styles.fileDetailValue}>{file.name}</span>
                </div>
                <div className={styles.fileDetail}>
                  <span className={styles.fileDetailLabel}>Original Size</span>
                  <span className={styles.fileDetailValue}>{formatSize(file.size)}</span>
                </div>
                <div className={styles.fileDetail}>
                  <span className={styles.fileDetailLabel}>Compressed Size</span>
                  <span className={styles.fileDetailValue}>{formatSize(compressedSize)}</span>
                </div>
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderLabel}>
                  <span>Transfer Speed</span>
                  <span>{transferSpeed}ms</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="500" 
                  step="50" 
                  value={transferSpeed} 
                  onChange={(e) => setTransferSpeed(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <div className={styles.fileInfo}>
                <div className={styles.fileDetail}>
                  <span className={styles.fileDetailLabel}>Total Chunks</span>
                  <span className={styles.fileDetailValue}>{totalChunks}</span>
                </div>
              </div>

              <div className={styles.controls}>
                <button className="btn-primary" onClick={startTransfer} style={{ flex: 1 }}>
                  Start Transfer
                </button>
                <button className="btn-secondary" onClick={reset}>
                  Change File
                </button>
              </div>
            </>
          )}

          {status === 'transferring' && (
            <div className={styles.qrContainer}>
              <div className={styles.qrWrapper}>
                {qrDataUrl && <img src={qrDataUrl} alt="QR Code Chunk" className={styles.qrImage} />}
              </div>
              <div style={{ width: '100%', maxWidth: '350px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className={styles.chunkText}>Transferring chunk {currentChunk + 1} of {totalChunks}</span>
                  <span className={styles.chunkText}>{Math.round(((currentChunk + 1) / totalChunks) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'var(--accent-primary)', 
                      width: `${((currentChunk + 1) / totalChunks) * 100}%`,
                      transition: 'width 0.1s linear'
                    }} 
                  />
                </div>
              </div>
              
              <button className="btn-danger" onClick={stopTransfer} style={{ marginTop: '1rem' }}>
                Stop Transfer
              </button>
            </div>
          )}

          {status === 'done' && (
            <div className={styles.doneContainer}>
              <svg className={styles.doneIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className={styles.doneTitle}>Transfer Complete!</h2>
              <button className="btn-primary" onClick={reset} style={{ marginTop: '1rem' }}>
                Send Another File
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
