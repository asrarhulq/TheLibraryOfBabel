import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./hub.css";

// Root layout for the hub ("/") and new experiments. Babel has its own root layout in
// app/(babel) — the two never share CSS or chrome.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thelibrary.page"),
  title: {
    default: "The Library — small experiments in infinity and the mind",
    template: "%s · The Library",
  },
  description:
    "A growing shelf of interactive experiences: the infinite Library of Babel, a false-memory experiment, and more.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#17100b",
  colorScheme: "dark",
};

export default function HubRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={serif.variable}>
      <body className="hub-body">{children}</body>
    </html>
  );
}
