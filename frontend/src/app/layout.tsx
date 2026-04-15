import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/providers/app-providers";
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
  title: {
    default: "Salon Manager PRO",
    template: "%s · Salon Manager PRO",
  },
  description:
    "SaaS za salone: kalendar, klijenti, finansije, online rezervacije i podsetnici.",
  applicationName: "Salon Manager PRO",
  authors: [{ name: "Dragan Saric" }],
  creator: "Dragan Saric",
  icons: {
    icon: [{ url: "/icons/pwa-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/pwa-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "Salon Manager PRO",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

/** Telefon / tablet / laptop: ispravna skala, notch, pejzaž. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c4a6e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only absolute left-4 top-4 z-[9999] rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-lg outline-none ring-2 ring-sky-500 focus:not-sr-only"
        >
          Preskoči na sadržaj
        </a>
        <AppProviders>
          <div className="flex min-h-dvh flex-1 flex-col">
            {children}
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
