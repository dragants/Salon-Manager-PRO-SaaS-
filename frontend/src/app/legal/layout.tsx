import { SiteFooter } from "@/components/layout/site-footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background">
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
