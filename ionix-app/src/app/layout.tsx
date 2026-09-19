import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const bodoni = localFont({
  variable: "--font-serif",
  display: "swap",
  src: [
    { path: "./fonts/bodoni-moda-400-normal-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/bodoni-moda-500-normal-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/bodoni-moda-400-italic-latin.woff2", weight: "400", style: "italic" },
    { path: "./fonts/bodoni-moda-500-italic-latin.woff2", weight: "500", style: "italic" },
  ],
});

const plexMono = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    { path: "./fonts/ibm-plex-mono-400-normal-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500-normal-latin.woff2", weight: "500", style: "normal" },
  ],
});

const inter = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "./fonts/inter-300-normal-latin.woff2", weight: "300", style: "normal" },
    { path: "./fonts/inter-400-normal-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500-normal-latin.woff2", weight: "500", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Ionix Group — App",
  description: "Gestione cantieri Ionix Group",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${bodoni.variable} ${plexMono.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
