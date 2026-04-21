import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
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
    "Za salone lepote, masaže i wellness: kalendar, klijenti, finansije, online rezervacije i podsetnici.",
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
    { media: "(prefers-color-scheme: light)", color: "#f4f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1a201d" },
  ],
};

const themeInitScript = `(function(){try{var k='smpro-theme';var s=localStorage.getItem(k);var dark;if(s==='dark')dark=true;else if(s==='light')dark=false;else dark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark);}catch(e){document.documentElement.classList.toggle('dark',window.matchMedia('(prefers-color-scheme: dark)').matches);}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full min-h-dvh flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only absolute left-4 top-4 z-[9999] rounded-md bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg outline-none ring-2 ring-primary focus:not-sr-only"
        >
          Preskoči na sadržaj
        </a>
        <AppProviders>
          <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
