import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "QR Transfer — Airgapped Offline File Transfer Web App",
    template: "%s | QR Transfer",
  },
  description:
    "Transfer files offline between any devices using animated QR codes. 100% serverless, private, and airgapped file transfer with zero network connection required.",
  keywords: [
    "airgapped file transfer",
    "qr code file transfer",
    "offline file transfer",
    "qr file share",
    "airgap data transfer",
    "nextjs qr code app",
    "pako gzip transfer",
    "local file share qr",
  ],
  authors: [{ name: "Proveyron" }],
  creator: "Proveyron",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://airgapped-qr-code-transfer-web.vercel.app",
    title: "QR Transfer — Airgapped Offline File Transfer Web App",
    description:
      "Transfer files offline between any devices using animated QR codes. 100% serverless, zero network required.",
    siteName: "QR Transfer",
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Transfer — Airgapped Offline File Transfer Web App",
    description:
      "Transfer files offline between any devices using animated QR codes. 100% serverless & private.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
