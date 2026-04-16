import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
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
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
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
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
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
