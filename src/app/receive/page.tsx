'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Header from '@/components/Header';
import styles from './receive.module.css';
import * as pako from 'pako';

type Status = 'idle' | 'scanning' | 'done';

const decode_data = (input_string: string): { index: number; data: number[] } => {
  const encoded_data = atob(input_string.split(',')[1]);
  const encoded_array = Array.from(encoded_data, (char) => char.charCodeAt(0));
  const utf8Decoder = new TextDecoder();
  const output_string = utf8Decoder.decode(new Uint8Array(encoded_array));
  const data_array = Array.from(output_string, (char) => char.charCodeAt(0));
  return {
    index: parseInt(input_string.split(',')[0]),
    data: data_array,
  };
};

export default function ReceivePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [receivedCount, setReceivedCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const receivedChunks = useRef<Record<number, number[]>>({});
  const scannerRef = useRef<any>(null);
  
  const resetState = () => {
    setStatus('idle');
    setFileName('');
    setTotalChunks(0);
    setReceivedCount(0);
    setErrorMessage('');
    receivedChunks.current = {};
  };

  const handleScanSuccess = useCallback((decodedText: string) => {
    try {
      if (decodedText.includes('"chunks"')) {
        const metadata = JSON.parse(decodedText);
        if (metadata.name && metadata.chunks) {
          setFileName(metadata.name);
          setTotalChunks(metadata.chunks);
          // Optional: reset if new file starts
          // receivedChunks.current = {};
          // setReceivedCount(0);
        }
      } else if (decodedText.includes(',')) {
        const parts = decodedText.split(',');
        if (parts.length === 2) {
          const { index, data } = decode_data(decodedText);
          if (!receivedChunks.current[index]) {
            receivedChunks.current[index] = data;
            setReceivedCount((prev) => {
              const newCount = prev + 1;
              return newCount;
            });
          }
        }
      }
    } catch (e) {
      console.error('Error parsing QR code:', e);
    }
  }, []);

  const handleScanFailure = useCallback((error: any) => {
    // Ignore frequent scan failures (e.g. no QR in frame)
  }, []);

  useEffect(() => {
    if (totalChunks > 0 && receivedCount === totalChunks && status === 'scanning') {
      const processCompleteFile = () => {
        try {
          const finalArray: number[] = [];
          for (let i = 0; i < totalChunks; i++) {
            if (receivedChunks.current[i]) {
              finalArray.push(...receivedChunks.current[i]);
            } else {
              throw new Error(`Missing chunk ${i}`);
            }
          }
          
          const decompressed = pako.inflate(new Uint8Array(finalArray));
          const blob = new Blob([decompressed]);
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName || 'received_file';
          a.click();
          URL.revokeObjectURL(url);
          
          setStatus('done');
          stopScanner();
        } catch (e) {
          console.error('Decompression error:', e);
          setErrorMessage('Error reconstructing file. It may be corrupted.');
        }
      };
      
      processCompleteFile();
    }
  }, [receivedCount, totalChunks, status, fileName]);

  const startScanner = async () => {
    setErrorMessage('');
    setStatus('scanning');
    
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      
      const config = { fps: 30, qrbox: { width: 300, height: 300 } };
      
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          handleScanSuccess,
          handleScanFailure
        );
      } catch (e) {
        console.warn('Could not start with environment camera, trying without constraints', e);
        await html5QrCode.start(
          { facingMode: 'user' },
          config,
          handleScanSuccess,
          handleScanFailure
        );
      }
    } catch (e: any) {
      console.error('Failed to start scanner:', e);
      setErrorMessage(`Failed to start camera: ${e.message}`);
      setStatus('idle');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner', e);
      }
      scannerRef.current = null;
    }
  };

  const handleStopScanning = () => {
    stopScanner();
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className={styles.container}>
      <Header title="Receive Mode" showBack={true} />
      
      <main className={styles.main}>
        <div className={styles.content}>
          {status === 'idle' && (
            <>
              <div className={styles.instructions}>
                <svg className={styles.instructionsIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className={styles.instructionsTitle}>Point your camera at the sender's screen to begin receiving</h2>
                <p className={styles.instructionsText}>
                  Keep the QR code well-lit and centered in the frame. The transfer will start automatically.
                </p>
              </div>
              
              {errorMessage && <p className={styles.error}>{errorMessage}</p>}
              
              <button 
                className="btn-primary" 
                onClick={startScanner}
              >
                Start Scanning
              </button>
              <p className={styles.note}>Camera access is required for QR scanning</p>
            </>
          )}

          <div style={{ display: status === 'scanning' ? 'block' : 'none' }}>
             <div className={styles.scannerContainer}>
               <div id="qr-reader"></div>
             </div>
             
             <div className={styles.scanInfo} style={{ marginTop: '2rem' }}>
                {fileName ? (
                  <>
                    <h3 className={styles.scanFileName}>{fileName}</h3>
                    <div className={styles.progressSection}>
                      <div className={styles.progressLabel}>
                        <span>Progress</span>
                        <span>{receivedCount} / {totalChunks}</span>
                      </div>
                      <div className={styles.chunkGrid}>
                        {Array.from({ length: Math.min(totalChunks, 200) }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`${styles.chunkDot} ${receivedChunks.current[i] ? styles.chunkDotReceived : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className={styles.instructionsText}>Looking for file metadata...</p>
                )}
                
                <button 
                  className="btn-danger" 
                  onClick={handleStopScanning}
                >
                  Stop Scanning
                </button>
             </div>
          </div>

          {status === 'done' && (
            <div className={styles.doneContainer}>
              <svg className={styles.doneIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className={styles.doneTitle}>File Received!</h2>
              <p className={styles.doneFileName}>{fileName}</p>
              
              <button 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={resetState}
              >
                Receive Another File
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
