import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background py-6 text-center text-sm text-muted-foreground">
      <p>© 2026 Dragan Saric</p>
      <nav
        className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        aria-label="Pravne informacije"
      >
        <Link
          href="/legal/terms"
          className="text-primary underline-offset-4 hover:underline"
        >
          Uslovi korišćenja
        </Link>
        <Link
          href="/legal/privacy"
          className="text-primary underline-offset-4 hover:underline"
        >
          Politika privatnosti
        </Link>
        <Link
          href="/legal/billing"
          className="text-primary underline-offset-4 hover:underline"
        >
          Pretplata i naplata
        </Link>
      </nav>
    </footer>
  );
}
