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
    "SIEM",
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
    url: "https://komrasec.com/",
    title: "Komra - Security Intelligence Simplified",
    description:
      "Enterprise-grade security monitoring and vulnerability assessment platform for distributed infrastructure",
    siteName: "Komra Security",
    images: [
      {
        url: "https://komrasec.com/images/icon-rounded-corners.png",
        width: 1200,
        height: 630,
        alt: "Komra Security Platform",
      },
    ],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/icon-rounded-corners.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/images/icon-rounded-corners.png",
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/icon-rounded-corners.png" type="image/png" />
        {/* Schema.org JSON-LD for rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Komra",
              url: "https://komrasec.com",
              logo: "https://komrasec.com/images/icon-rounded-corners.png",
              sameAs: ["https://www.linkedin.com/company/komra/"],
            }),
          }}
        />
      </head>
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