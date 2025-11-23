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
  title: "fixmesleep · MCP Server",
  description: "MCP endpoints powering fixmesleep's sleep data tooling.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "fixmesleep · MCP Server",
    description: "MCP endpoints powering fixmesleep's sleep data tooling.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "fixmesleep MCP server preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "fixmesleep · MCP Server",
    description: "MCP endpoints powering fixmesleep's sleep data tooling.",
    images: ["/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
