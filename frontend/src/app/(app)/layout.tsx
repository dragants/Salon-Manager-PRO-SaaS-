import { AppShellProvider } from "@/components/app/app-shell-provider";
import { AppSidebar } from "@/components/app/sidebar";
import { AppTopBar } from "@/components/app/app-top-bar";
import { AuthGuard } from "@/components/app/auth-guard";
import { MobileDock } from "@/components/app/mobile-dock";
import { NotificationsBootstrap } from "@/components/app/notifications-bootstrap";
import { PageStatsStrip } from "@/components/app/page-stats-strip";
import { SetupBanner } from "@/components/app/setup-banner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShellProvider>
        <NotificationsBootstrap />
        <div className="flex min-h-full min-h-dvh flex-1 flex-col md:flex-row">
          <AppSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <SetupBanner />
            <AppTopBar />
            <PageStatsStrip />
            <main
            id="main-content"
            className="min-w-0 flex-1 overflow-auto bg-background px-4 py-5 pb-[max(5.5rem,env(safe-area-inset-bottom,0px)+4.5rem)] sm:px-6 md:px-8 md:py-8 md:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
          <MobileDock />
        </div>
      </AppShellProvider>
    </AuthGuard>
  );
}
