import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ClientToaster from "@/components/ClientToaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://komrasec.com/"),
  title: "Komra",
  description:
    "Security Intelligence Simplified - Enterprise-grade security monitoring for everyone",
  keywords: [
    "security",
    "vulnerability assessment",
    "endpoint monitoring",
    "cybersecurity",
    "audit",
    "compliance",
  ],
  authors: [{ name: "Komra" }],
  creator: "Komra",
  publisher: "Komra",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.linkedin.com/company/komra/",
    title: "Komra - Security Intelligence Simplified",
    description:
      "Enterprise-grade security monitoring and vulnerability assessment platform for distributed infrastructure",
    siteName: "Komra Security",
    images: [
      {
        url: "/images/icon rounded corners.png",
        width: 1200,
        height: 630,
        alt: "Komra Security Platform",
      },
    ],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/images/icon rounded corners.png",
    shortcut: "/images/icon rounded corners.png",
    apple: "/images/icon rounded corners.png",
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationProvider>
          <AuthProvider>
            {children}
            <ClientToaster />
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
