import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { ChatProvider } from "@/providers/chat-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "fixmesleep · Data",
  description: "Ultrahuman-powered sleep analytics, logs, and chat tooling.",
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    title: "fixmesleep · Data",
    description: "Ultrahuman-powered sleep analytics, logs, and chat tooling.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "fixmesleep data preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "fixmesleep · Data",
    description: "Ultrahuman-powered sleep analytics, logs, and chat tooling.",
    images: ["/og"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased flex flex-col`}
      >
        <ChatProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 flex-1 flex flex-col min-h-0">
            {children}
          </main>
        </ChatProvider>
      </body>
    </html>
  );
}
