import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";
import IntroSequence from "@/components/IntroSequence";
import SessionInit from "@/components/SessionInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Infinite Library of Babel",
  description: "An infinite, deterministic library containing every possible combination of letters.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <SessionInit />
          <Navbar />
          <main className="pt-16 h-screen w-screen overflow-hidden relative z-10">
            {children}
          </main>
          <IntroSequence />
        </ToastProvider>
      </body>
    </html>
  );
}
