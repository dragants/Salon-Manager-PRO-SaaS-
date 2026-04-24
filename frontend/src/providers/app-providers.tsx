"use client";

import { Toaster } from "sonner";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { LocaleProvider } from "@/lib/i18n/locale";
import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ChunkLoadRecovery } from "./chunk-load-recovery";
import { OrganizationProvider } from "./organization-provider";
import { ServiceWorkerRegister } from "./service-worker-register";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <QueryProvider>
        <AuthProvider>
          <OrganizationProvider>
            <ModalProvider>
              <ServiceWorkerRegister />
              <ChunkLoadRecovery />
              {children}
              <Toaster richColors position="top-center" closeButton />
            </ModalProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryProvider>
    </LocaleProvider>
  );
}
