import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CostumeTrack - Inventory & Rental Management",
  description: "Inventory management and rental tracking for costume shops, theaters, and costume makers.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://costumetrack.com"),
  openGraph: {
    title: "CostumeTrack - Inventory & Rental Management",
    description: "Inventory management and rental tracking for costume shops, theaters, and costume makers.",
    siteName: "CostumeTrack",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CostumeTrack",
    description: "Inventory management and rental tracking for costume shops, theaters, and costume makers.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
