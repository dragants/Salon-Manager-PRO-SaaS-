"use client";
import { useT } from "@/lib/i18n/locale";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient, getAnalytics, getBillingStatus, getClients } from "@/lib/api";
import { ClientDetailSheet } from "@/components/features/clients/client-detail-sheet";
import { ClientList } from "@/components/features/clients/client-list";
import {
  applyClientDirectoryFilters,
  defaultClientDirectoryFilters,
  filterClientsByQuery,
  type ClientDirectoryFilters,
} from "@/components/features/clients/client-filters";
import { ClientSearch } from "@/components/features/clients/client-search";
import { useModal } from "@/components/providers/ModalProvider";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/errors";
import { isPlanLimitClientCode } from "@/lib/plan-paywall";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { canDeleteRecords } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import { notifyApp } from "@/lib/notifications-store";
import type { Client } from "@/types/client";
import type { ClientLimitState } from "@/types/billing";
import type { AnalyticsResponse } from "@/types/analytics";

import "./clients-page.css";

function ClientsPageContent() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOpen: setAppModal } = useModal();
  const { user } = useAuth();
  const { settings } = useOrganization();
  const allowDelete = canDeleteRecords(user, settings);

  const [rows, setRows] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ClientDirectoryFilters>(
    defaultClientDirectoryFilters
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailClientId, setDetailClientId] = useState<number | null>(null);

  const [clientLimits, setClientLimits] = useState<ClientLimitState | null>(
    null
  );
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const showFinancialKpi = user?.role !== "worker";

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const { data } = await getClients();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, t.common.error));
      setRows([]);
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user || user.role === "worker") {
      return;
    }
    void getBillingStatus()
      .then((r) => setClientLimits(r.data.client_limits ?? null))
      .catch(() => setClientLimits(null));
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    void getAnalytics()
      .then((r) => setAnalytics(r.data))
      .catch(() => setAnalytics(null));
  }, [user]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setOpen(true);
      router.replace("/clients", { scroll: false });
    }
  }, [searchParams, router]);

  const searchFiltered = useMemo(
    () => filterClientsByQuery(rows, search),
    [rows, search]
  );

  const filteredRows = useMemo(
    () =>
      applyClientDirectoryFilters(searchFiltered, filters, {
        showFinancial: showFinancialKpi,
      }),
    [searchFiltered, filters, showFinancialKpi]
  );

  function openClientSheet(clientId: number) {
    setDetailClientId(clientId);
    setSheetOpen(true);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !phone.trim()) {
      setFormError("Ime i telefon su obavezni.");
      return;
    }
    if (phone.trim().length < 6) {
      setFormError("Telefon min. 6 karaktera.");
      return;
    }
    setSaving(true);
    try {
      await createClient({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        notes: notes.trim() || undefined,
      });
      toast.success("Klijent je sačuvan.");
      notifyApp({
        title: t.clients.newClient,
        body: `${name.trim()} je dodat u listu.`,
        href: "/clients",
      });
      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      await load({ silent: true });
      void getBillingStatus()
        .then((r) => setClientLimits(r.data.client_limits ?? null))
        .catch(() => {});
    } catch (err) {
      const code = getApiErrorCode(err);
      if (isPlanLimitClientCode(code)) {
        setFormError(null);
        setAppModal("paywall");
        toast.error(getApiErrorMessage(err, "Dostignut je limit klijenata."));
      } else {
        setFormError(getApiErrorMessage(err, "Klijent nije kreiran."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title={t.clients.title}
        description={
          <>
            Kartice umesto tabele — ime i akcija su uvek u prvom planu.{" "}
            <strong>E-mail</strong> za podsetnike. Karton i prilozi su u folderu
            klijenta na serveru.
          </>
        }
        action={
          <Button type="button" onClick={() => setOpen(true)}>
            + Novi klijent
          </Button>
        }
      />

      {clientLimits?.enforced && clientLimits.max_clients != null ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm",
            clientLimits.at_limit
              ? "border-amber-200/90 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30"
              : "border-border/90 bg-muted/80 dark:bg-card/40"
          )}
        >
          <span className="text-foreground">
            {clientLimits.plan === "pro"
              ? "Pro plan"
              : clientLimits.plan === "basic"
                ? "Basic plan"
                : "Besplatan plan"}{" "}
            ·{" "}
            <span className="tabular-nums font-semibold text-foreground">
              {clientLimits.current_clients}/{clientLimits.max_clients}
            </span>{" "}
            klijenata
            {clientLimits.at_limit ? " — limit je dostignut." : null}
          </span>
          {clientLimits.plan === "free" ? (
            <Link
              href="/subscribe"
              className="shrink-0 font-semibold text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
            >
              Aktiviraj pretplatu
            </Link>
          ) : clientLimits.plan === "basic" ? (
            <Link
              href="/subscribe"
              className="shrink-0 font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
            >
              Nadogradi na Pro
            </Link>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <SurfaceCard padding="md" className="overflow-hidden">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-11 w-full max-w-md rounded-xl" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <div className="cl-skeletons">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="cl-skeletons__item" />
            ))}
          </div>
        </SurfaceCard>
      ) : rows.length === 0 ? (
        <SurfaceCard
          padding="lg"
          className="border-dashed text-center text-sm text-muted-foreground"
        >
          Još nema klijenata. Klikni „+ Novi klijent“.
        </SurfaceCard>
      ) : (
        <SurfaceCard padding="md" className="overflow-hidden">
          <ClientSearch
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFiltersChange={setFilters}
            filteredCount={filteredRows.length}
            totalCount={rows.length}
            showFinancial={showFinancialKpi}
            className="mb-6"
          />

          <ClientList
            clients={filteredRows}
            searchQuery={search}
            onOpenCard={(id) => openClientSheet(id)}
            analytics={analytics}
            orgClientsCount={rows.length}
            showFinancial={showFinancialKpi}
          />
        </SurfaceCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border sm:max-w-md" showCloseButton>
          <form onSubmit={onCreate}>
            <DialogHeader>
              <DialogTitle>Novi klijent</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {formError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                  {formError}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="cl-name">Ime</Label>
                <Input
                  id="cl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-phone">Telefon</Label>
                <Input
                  id="cl-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-email">E-mail (opciono)</Label>
                <Input
                  id="cl-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="za podsetnike i potvrde"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-notes">Beleška (opciono)</Label>
                <Input
                  id="cl-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Otkaži
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t.common.loading : t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ClientDetailSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) {
            setDetailClientId(null);
          }
        }}
        clientId={detailClientId}
        allowDelete={allowDelete}
        userRole={user?.role}
        onClientUpdated={() => load({ silent: true })}
      />
    </div>
  );
}

export default function ClientsPage() {
  const t = useT();
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8">
          <SectionHeader
            title={t.clients.title}
            description={t.clients.loadingClients}
          />
          <SurfaceCard padding="md">
            <Skeleton className="mb-5 h-11 w-full max-w-md rounded-xl" />
            <div className="cl-skeletons">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cl-skeletons__item" />
              ))}
            </div>
          </SurfaceCard>
        </div>
      }
    >
      <ClientsPageContent />
    </Suspense>
  );
}
