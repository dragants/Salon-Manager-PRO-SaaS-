"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "./auth-provider";
import { ChunkLoadRecovery } from "./chunk-load-recovery";
import { OrganizationProvider } from "./organization-provider";
import { ServiceWorkerRegister } from "./service-worker-register";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <ServiceWorkerRegister />
        <ChunkLoadRecovery />
        {children}
        <Toaster richColors position="top-center" closeButton />
      </OrganizationProvider>
    </AuthProvider>
  );
}
