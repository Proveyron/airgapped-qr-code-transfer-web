import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Transfer — Airgapped File Transfer",
  description: "Transfer files between devices using QR codes. No internet required.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
