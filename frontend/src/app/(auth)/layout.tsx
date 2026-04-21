import { SiteFooter } from "@/components/layout/site-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="main-content"
      className="relative z-[1] flex min-h-dvh min-w-0 flex-1 flex-col bg-background text-foreground"
    >
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
