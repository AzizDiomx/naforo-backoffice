import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Naforo — Votre patrimoine à portée de main",
  description: "Plateforme intelligente de gestion locative et immobilière en Afrique de l'Ouest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4500,
            style: {
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
            success: {
              style: {
                background: '#064e3b',
                color: '#ecfdf5',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              },
              iconTheme: {
                primary: '#34d399',
                secondary: '#064e3b',
              },
            },
            error: {
              duration: 5500,
              style: {
                background: '#450a0a',
                color: '#fef2f2',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              },
              iconTheme: {
                primary: '#f87171',
                secondary: '#450a0a',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
