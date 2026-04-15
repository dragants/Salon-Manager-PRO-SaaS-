import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200/90 bg-zinc-50/90 py-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
      <p>© 2026 Dragan Saric</p>
      <nav
        className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        aria-label="Pravne informacije"
      >
        <Link
          href="/legal/terms"
          className="text-sky-800 underline-offset-4 hover:underline dark:text-sky-400"
        >
          Uslovi korišćenja
        </Link>
        <Link
          href="/legal/privacy"
          className="text-sky-800 underline-offset-4 hover:underline dark:text-sky-400"
        >
          Politika privatnosti
        </Link>
        <Link
          href="/legal/billing"
          className="text-sky-800 underline-offset-4 hover:underline dark:text-sky-400"
        >
          Pretplata i naplata
        </Link>
      </nav>
    </footer>
  );
}
