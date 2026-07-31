# 📡 QR Transfer — Airgapped File Transfer Web App

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**QR Transfer** is a modern, zero-dependency, serverless web application that enables secure, airgapped file transfers between any two devices using dynamic animated QR codes. No local network, Wi-Fi, Bluetooth, internet connection, or physical cables required.

Inspired by [mohankumarelec/airgapped-qr-code-transfer](https://github.com/mohankumarelec/airgapped-qr-code-transfer). Rebuilt from scratch with Next.js 16 (App Router), TypeScript, pako compression, qrcode rendering, and html5-qrcode web scanning.

---

## ✨ Features

- 🔒 **100% Airgapped & Offline Ready**: Complete end-to-end file transfers happen locally inside the browser.
- 📁 **Universal File Picker & Drag-and-Drop**: Upload any file format from any device (mobile or desktop).
- ⚡ **Gzip Data Compression**: Compresses file buffers using `pako` before chunking to optimize QR density.
- 📺 **Animated QR Code Carousel**: Renders sequential 250-byte encoded data chunks with customizable frame delay (50ms - 500ms).
- 📷 **Instant Camera Scanner**: Scans QR streams via device camera (front or back environment camera).
- 📊 **Real-time Progress Grid**: Visual chunk map displaying received vs. pending chunks during scanning.
- 🎨 **Modern Dark Glassmorphism UI**: Built with custom CSS design tokens, smooth gradients, and micro-animations.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Compression**: [pako](https://github.com/nodeca/pako) (Gzip)
- **QR Generation**: [qrcode](https://github.com/soldair/node-qrcode)
- **QR Scanning**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **Styling**: Pure Vanilla CSS (CSS Modules & Design Tokens)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm installed.

### Installation

```bash
# Clone the repository
git clone https://github.com/Proveyron/airgapped-qr-code-transfer-web.git
cd airgapped-qr-code-transfer-web

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

This project is optimized for 1-click deployment on [Vercel](https://vercel.com).

```bash
npm install -g vercel
vercel
```

Or connect the repository on the [Vercel Dashboard](https://vercel.com/new).

---

## 📄 License

MIT License. Free for open source and personal use.
