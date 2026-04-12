import { AppSidebar } from "@/components/app/sidebar";
import { AuthGuard } from "@/components/app/auth-guard";
import { MobileDock } from "@/components/app/mobile-dock";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-full min-h-dvh flex-1 flex-col md:flex-row">
        <AppSidebar />
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-auto bg-[#f8fafc] px-4 py-5 pb-[max(5.5rem,env(safe-area-inset-bottom,0px)+4.5rem)] dark:bg-slate-950 sm:px-6 md:px-8 md:py-8 md:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <MobileDock />
      </div>
    </AuthGuard>
  );
}
