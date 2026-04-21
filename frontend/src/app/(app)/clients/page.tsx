"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  createClient,
  createClientChartEntry,
  deleteClient,
  downloadClientChartFile,
  getAnalytics,
  getBillingStatus,
  getClientDetail,
  getClients,
  updateClient,
} from "@/lib/api";
import { appointmentStaffLabel } from "@/components/features/calendar/calendar-utils";
import { useModal } from "@/components/providers/ModalProvider";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/errors";
import { isPlanLimitClientCode } from "@/lib/plan-paywall";
import { Button } from "@/components/ui/button";
import {
  ClientDirectoryTiles,
  ClientsKpiStats,
} from "@/components/features/clients/client-directory";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clientInsights,
  fileToBase64Part,
  formatDt,
  statusSr,
} from "@/lib/clients-page-utils";
import { canDeleteRecords } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import { notifyApp } from "@/lib/notifications-store";
import type {
  Client,
  ClientChartEntry,
  ClientDetail,
} from "@/types/client";
import type { ClientLimitState } from "@/types/billing";
import type { AnalyticsResponse } from "@/types/analytics";

import "./clients-page.css";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type CardTab = "osnovno" | "loyalty" | "istorija" | "karton";

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOpen: setAppModal } = useModal();
  const { user } = useAuth();
  const { settings } = useOrganization();
  const allowDelete = canDeleteRecords(user, settings);

  const [rows, setRows] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cardOpen, setCardOpen] = useState(false);
  const [cardTab, setCardTab] = useState<CardTab>("osnovno");
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  const [kTitle, setKTitle] = useState("");
  const [kNotes, setKNotes] = useState("");
  const [kVisitAt, setKVisitAt] = useState("");
  const [kApptId, setKApptId] = useState<string>("");
  const [kFiles, setKFiles] = useState<FileList | null>(null);
  const [kSaving, setKSaving] = useState(false);
  const [kError, setKError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setError(getApiErrorMessage(e, "Klijenti nisu učitani."));
      setRows([]);
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  }, []);

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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const phone = (c.phone ?? "").toLowerCase();
      const em = (c.email ?? "").toLowerCase();
      const notes = (c.notes ?? "").toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        em.includes(q) ||
        notes.includes(q)
      );
    });
  }, [rows, search]);

  async function openCard(clientId: number) {
    setCardOpen(true);
    setCardTab("osnovno");
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    setKError(null);
    setKTitle("");
    setKNotes("");
    setKVisitAt("");
    setKApptId("");
    setKFiles(null);
    try {
      const { data } = await getClientDetail(clientId);
      setDetail(data);
      setEditName(data.client.name);
      setEditPhone(data.client.phone ?? "");
      setEditEmail(data.client.email?.trim() ?? "");
      setEditNotes(data.client.notes ?? "");
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Kartica nije učitana."));
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshDetail() {
    if (!detail?.client.id) return;
    setDetailLoading(true);
    try {
      const { data } = await getClientDetail(detail.client.id);
      setDetail(data);
      setEditName(data.client.name);
      setEditPhone(data.client.phone ?? "");
      setEditEmail(data.client.email?.trim() ?? "");
      setEditNotes(data.client.notes ?? "");
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Osvežavanje nije uspelo."));
    } finally {
      setDetailLoading(false);
    }
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
        title: "Novi klijent",
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

  async function onDeleteClient() {
    if (!detail) return;
    setDeleting(true);
    setDetailError(null);
    try {
      await deleteClient(detail.client.id);
      setCardOpen(false);
      setDetail(null);
      await load({ silent: true });
      void getBillingStatus()
        .then((r) => setClientLimits(r.data.client_limits ?? null))
        .catch(() => {});
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Brisanje nije uspelo."));
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  async function onSaveClientBasics() {
    if (!detail) return;
    setCardSaving(true);
    setDetailError(null);
    try {
      await updateClient(detail.client.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        notes: editNotes.trim(),
      });
      await refreshDetail();
      await load({ silent: true });
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Čuvanje nije uspelo."));
    } finally {
      setCardSaving(false);
    }
  }

  async function onSaveKarton(e: React.FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setKError(null);
    const files = kFiles ? Array.from(kFiles) : [];
    if (files.length > MAX_FILES) {
      setKError(`Najviše ${MAX_FILES} fajlova odjednom.`);
      return;
    }
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        setKError(`Fajl „${f.name}“ je prevelik (max 5 MB).`);
        return;
      }
    }
    const payloads = [];
    for (const f of files) {
      payloads.push({
        filename: f.name,
        mime_type: f.type || "application/octet-stream",
        data_base64: await fileToBase64Part(f),
      });
    }
    setKSaving(true);
    try {
      await createClientChartEntry(detail.client.id, {
        visit_at: kVisitAt ? new Date(kVisitAt).toISOString() : undefined,
        title: kTitle.trim() || null,
        notes: kNotes.trim() || null,
        appointment_id: kApptId ? Number.parseInt(kApptId, 10) : null,
        files: payloads,
      });
      setKTitle("");
      setKNotes("");
      setKVisitAt("");
      setKApptId("");
      setKFiles(null);
      await refreshDetail();
    } catch (err) {
      setKError(getApiErrorMessage(err, "Unos u karton nije sačuvan."));
    } finally {
      setKSaving(false);
    }
  }

  async function onDownloadFile(entry: ClientChartEntry, fileId: number) {
    if (!detail) return;
    try {
      const blob = await downloadClientChartFile(detail.client.id, fileId);
      const att = entry.attachments.find((a) => a.id === fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att?.original_name ?? "prilog";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDetailError("Preuzimanje fajla nije uspelo.");
    }
  }

  const tabs: { id: CardTab; label: string }[] = [
    { id: "osnovno", label: "Osnovno" },
    { id: "loyalty", label: "Loyalty" },
    { id: "istorija", label: "Istorija dolazaka" },
    { id: "karton", label: "Karton / beleške" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Klijenti"
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
        <SurfaceCard padding="lg" className="border-dashed text-center text-sm text-muted-foreground">
          Još nema klijenata. Klikni „+ Novi klijent“.
        </SurfaceCard>
      ) : (
        <SurfaceCard padding="md" className="overflow-hidden">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraga: ime, telefon, e-mail, beleška…"
              className="max-w-lg rounded-xl border-border bg-card text-base"
              aria-label="Pretraga klijenata"
            />
            <p className="shrink-0 text-sm font-medium text-muted-foreground">
              <span className="tabular-nums font-semibold text-foreground">
                {filteredRows.length}
              </span>{" "}
              od {rows.length} klijenata
            </p>
          </div>

          <ClientsKpiStats
            clientsCount={analytics?.clients ?? rows.length}
            appointmentsToday={analytics?.appointments_today ?? 0}
            revenueToday={analytics?.revenue_today ?? 0}
            showFinancial={showFinancialKpi}
          />

          {filteredRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nema rezultata za „{search.trim()}“.
            </p>
          ) : (
            <ClientDirectoryTiles
              clients={filteredRows}
              onOpenCard={(id) => void openCard(id)}
              calendarHref="/calendar"
            />
          )}
        </SurfaceCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="border-border sm:max-w-md "
          showCloseButton
        >
          <form onSubmit={onCreate}>
            <DialogHeader>
              <DialogTitle>Novi klijent</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {formError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
                {saving ? "Čuvam…" : "Sačuvaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cardOpen}
        onOpenChange={(o) => {
          setCardOpen(o);
          if (!o) {
            setDetail(null);
          }
        }}
      >
        <DialogContent
          className="flex max-h-[92vh] flex-col border-border sm:max-w-4xl lg:max-w-5xl "
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>
              {detail ? detail.client.name : "Kartica klijenta"}
            </DialogTitle>
          </DialogHeader>

          {detailError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {detailError}
            </div>
          ) : null}

          {detailLoading && !detail ? (
            <p className="text-sm text-muted-foreground">
              Učitavanje kartice…
            </p>
          ) : null}

          {detail ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-border/90 pb-2 ">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCardTab(t.id)}
                    className={cn(
                      "shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      cardTab === t.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted dark:text-muted-foreground/70 dark:hover:bg-muted"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {cardTab === "loyalty" ? (
                  <div className="space-y-3 py-2">
                    {detail.loyalty_balances &&
                    detail.loyalty_balances.length > 0 ? (
                      <ul className="space-y-3">
                        {detail.loyalty_balances.map((b) => (
                          <li
                            key={b.program_id}
                            className="rounded-xl border border-border bg-muted/80 px-4 py-3 dark:bg-card/40"
                          >
                            <p className="font-medium text-foreground">
                              {b.program_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {b.service_name} · cilj {b.visits_required}{" "}
                              završenih poseta
                            </p>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm">
                              <span>
                                Pečati:{" "}
                                <strong className="tabular-nums">
                                  {b.stamps} / {b.visits_required}
                                </strong>
                              </span>
                              <span>
                                Nagrade na čekanju:{" "}
                                <strong className="tabular-nums text-emerald-700 dark:text-emerald-400">
                                  {b.rewards_available}
                                </strong>
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nema aktivnog loyalty programa ili još nema stanja za
                        ovog klijenta. Podesi program u{" "}
                        <strong>Podešavanja → Loyalty</strong>.
                      </p>
                    )}
                  </div>
                ) : null}

                {cardTab === "osnovno" ? (
                  <div className="grid gap-6 py-2 lg:grid-cols-10 lg:gap-8">
                    <aside className="space-y-4 rounded-2xl border border-border/90 bg-gradient-to-b from-violet-50/90 via-white to-muted/80 p-4  dark:from-violet-950/30 dark:via-background/40 dark:to-background/60 lg:col-span-3">
                      {detail ? (
                        (() => {
                          const ins = clientInsights(detail);
                          return (
                            <>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Status terapije
                                </p>
                                <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                                  {ins.therapyStatus}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Poslednja poseta
                                </p>
                                <p className="mt-1 text-sm text-foreground">
                                  {ins.lastDone
                                    ? `${formatDt(ins.lastDone.date)} · ${ins.lastDone.service_name}`
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Sledeći termin
                                </p>
                                <p className="mt-1 text-sm text-foreground">
                                  {ins.next
                                    ? `${formatDt(ins.next.date)} · ${ins.next.service_name}`
                                    : "Nema zakazanog"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Tip problema / cilj
                                </p>
                                <p className="mt-1 line-clamp-4 text-sm text-foreground">
                                  {ins.problemLine}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Terapeutske napomene
                                </p>
                                <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-sm text-foreground">
                                  {ins.therapistNotes}
                                </p>
                              </div>
                            </>
                          );
                        })()
                      ) : null}
                    </aside>
                    <div className="space-y-4 lg:col-span-7">
                    <div className="space-y-2">
                      <Label htmlFor="ec-name">Ime</Label>
                      <Input
                        id="ec-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec-phone">Telefon</Label>
                      <Input
                        id="ec-phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec-email">E-mail (opciono)</Label>
                      <Input
                        id="ec-email"
                        type="email"
                        autoComplete="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="za podsetnike i potvrde termina"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec-notes">Opšta beleška</Label>
                      <textarea
                        id="ec-notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        disabled={cardSaving || !editName.trim()}
                        onClick={() => void onSaveClientBasics()}
                      >
                        {cardSaving ? "Čuvam…" : "Sačuvaj osnovno"}
                      </Button>
                    </div>
                    <div className="border-t border-red-100 pt-4">
                      {allowDelete ? (
                        <>
                          <p className="mb-2 text-xs text-red-800/90">
                            Brisanje klijenta briše i{" "}
                            <strong>zakazane termine</strong>, karton i{" "}
                            <strong>folder sa prilozima</strong> na serveru
                            (nepovratno).
                          </p>
                          {deleteConfirm ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                disabled={deleting}
                                onClick={() => void onDeleteClient()}
                              >
                                {deleting ? "Brišem…" : "Potvrdi brisanje"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={deleting}
                                onClick={() => setDeleteConfirm(false)}
                              >
                                Otkaži
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-200 text-red-800 hover:bg-red-50"
                              onClick={() => setDeleteConfirm(true)}
                            >
                              Obriši klijenta
                            </Button>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {user?.role === "worker"
                            ? "Brisanje klijenata nije dozvoljeno za tvoj nalog. Administrator može da uključi dozvolu u Podešavanja → Sigurnost."
                            : "Brisanje nije dostupno."}
                        </p>
                      )}
                    </div>
                    </div>
                  </div>
                ) : null}

                {cardTab === "istorija" ? (
                  <div className="space-y-3 py-2">
                    <p className="text-sm text-muted-foreground">
                      Zakazivanja iz kalendara za ovog klijenta.
                    </p>
                    {detail.appointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nema zapisa.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.appointments.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-xl border border-border/90 bg-muted/80 px-3 py-2 text-sm dark:bg-card/50"
                          >
                            <div className="font-medium text-foreground">
                              {a.service_name}
                            </div>
                            <div className="text-muted-foreground">
                              {formatDt(a.date)} · {a.duration} min ·{" "}
                              {statusSr(a.status)}
                              {appointmentStaffLabel(a)
                                ? ` · ${appointmentStaffLabel(a)}`
                                : ""}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}

                {cardTab === "karton" ? (
                  <div className="space-y-6 py-2">
                    <form
                      onSubmit={onSaveKarton}
                      className="space-y-3 rounded-2xl border border-border/90 bg-card p-4"
                    >
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        Nov unos u karton
                      </h3>
                      {kError ? (
                        <p className="text-sm text-red-700">{kError}</p>
                      ) : null}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="kv-date">Datum / vreme posete</Label>
                          <Input
                            id="kv-date"
                            type="datetime-local"
                            value={kVisitAt}
                            onChange={(e) => setKVisitAt(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kv-appt">Poveži sa terminom (ID)</Label>
                          <select
                            id="kv-appt"
                            value={kApptId}
                            onChange={(e) => setKApptId(e.target.value)}
                            className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                          >
                            <option value="">— bez veze —</option>
                            {detail.appointments.map((a) => (
                              <option key={a.id} value={String(a.id)}>
                                #{a.id} · {formatDt(a.date)} · {a.service_name}
                                {appointmentStaffLabel(a)
                                  ? ` · ${appointmentStaffLabel(a)}`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kv-title">Naslov / tretman</Label>
                        <Input
                          id="kv-title"
                          value={kTitle}
                          onChange={(e) => setKTitle(e.target.value)}
                          placeholder="npr. Tretman lica"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kv-notes">Beleška, rezultat</Label>
                        <textarea
                          id="kv-notes"
                          value={kNotes}
                          onChange={(e) => setKNotes(e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                          placeholder="Šta je urađeno, napomene posle tretmana…"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kv-files">
                          Prilozi (slike, PDF — max5 × 5 MB; snimaju se u folder ovog klijenta na serveru)
                        </Label>
                        <Input
                          id="kv-files"
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => setKFiles(e.target.files)}
                        />
                      </div>
                      <Button type="submit" disabled={kSaving}>
                        {kSaving ? "Čuvam…" : "Dodaj u karton"}
                      </Button>
                    </form>

                    <div>
                      <h3 className="font-heading mb-2 text-sm font-semibold text-foreground">
                        Istorija kartona
                      </h3>
                      {detail.chart_entries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Još nema unosa u karton.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {detail.chart_entries.map((e) => (
                            <li
                              key={e.id}
                              className="rounded-xl border border-border/90 bg-muted/60 p-3 text-sm dark:bg-card/40"
                            >
                              <div className="font-medium text-foreground">
                                {e.title || "Bez naslova"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDt(e.visit_at)}
                                {e.appointment_id
                                  ? ` · termin #${e.appointment_id}`
                                  : ""}
                              </div>
                              {e.notes ? (
                                <p className="mt-2 whitespace-pre-wrap text-foreground">
                                  {e.notes}
                                </p>
                              ) : null}
                              {e.attachments?.length ? (
                                <ul className="mt-2 space-y-1">
                                  {e.attachments.map((f) => (
                                    <li key={f.id}>
                                      <button
                                        type="button"
                                        className="text-left text-foreground underline hover:text-foreground"
                                        onClick={() =>
                                          void onDownloadFile(e, f.id)
                                        }
                                      >
                                        {f.original_name} (
                                        {Math.round(f.size_bytes / 1024)} KB)
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8">
          <SectionHeader
            title="Klijenti"
            description="Učitavanje liste klijenata…"
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
