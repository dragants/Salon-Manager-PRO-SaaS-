"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  createClient,
  createClientChartEntry,
  deleteClient,
  downloadClientChartFile,
  getBillingStatus,
  getClientDetail,
  getClients,
  updateClient,
} from "@/lib/api";
import { appointmentStaffLabel } from "@/components/features/calendar/calendar-utils";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/errors";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Skeleton, TableRowSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canDeleteRecords } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useTableHeadShadow } from "@/hooks/useTableHeadShadow";
import { useTableViewportWindow } from "@/hooks/useTableViewportWindow";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import { notifyApp } from "@/lib/notifications-store";
import type {
  Client,
  ClientChartEntry,
  ClientDetail,
} from "@/types/client";
import type { ClientLimitState } from "@/types/billing";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type CardTab = "osnovno" | "loyalty" | "istorija" | "karton";

function fileToBase64Part(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = () => reject(new Error("Čitanje fajla nije uspelo."));
    r.readAsDataURL(file);
  });
}

function statusSr(status: string) {
  if (status === "scheduled") return "Zakazano";
  if (status === "completed") return "Završeno";
  if (status === "no_show") return "Nije došao/la";
  return status;
}

function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString("sr-Latn-RS", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("sr-Latn-RS", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isNewClient(c: Client): boolean {
  try {
    const d = new Date(c.created_at).getTime();
    return (Date.now() - d) / 86_400_000 <= 7;
  } catch {
    return false;
  }
}

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const [tableEditId, setTableEditId] = useState<number | null>(null);
  const [tableDraft, setTableDraft] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [tableSaving, setTableSaving] = useState(false);
  const [clientLimits, setClientLimits] = useState<ClientLimitState | null>(
    null
  );

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

  const editRowIndex = useMemo(() => {
    if (tableEditId == null) {
      return null;
    }
    const i = filteredRows.findIndex((c) => c.id === tableEditId);
    return i >= 0 ? i : null;
  }, [tableEditId, filteredRows]);

  const clientsTableScrollRef = useRef<HTMLDivElement>(null);
  const clientsHeadShadow = useTableHeadShadow(clientsTableScrollRef);
  const clientsTv = useTableViewportWindow(
    clientsTableScrollRef,
    filteredRows.length,
    52,
    { minItems: 45, pinIndex: editRowIndex }
  );
  const showClientsVirtual = clientsTv.enabled;
  const visibleClients = showClientsVirtual
    ? filteredRows.slice(clientsTv.from, clientsTv.to)
    : filteredRows;

  function startTableEdit(c: Client) {
    setTableEditId(c.id);
    setTableDraft({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email?.trim() ?? "",
    });
  }

  function cancelTableEdit() {
    setTableEditId(null);
  }

  async function saveTableEdit() {
    if (tableEditId == null) {
      return;
    }
    if (!tableDraft.name.trim() || !tableDraft.phone.trim()) {
      return;
    }
    setTableSaving(true);
    try {
      await updateClient(tableEditId, {
        name: tableDraft.name.trim(),
        phone: tableDraft.phone.trim(),
        email: tableDraft.email.trim() ? tableDraft.email.trim() : null,
      });
      setTableEditId(null);
      await load({ silent: true });
    } catch (e) {
      setError(getApiErrorMessage(e, "Izmena nije sačuvana."));
    } finally {
      setTableSaving(false);
    }
  }

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
      if (getApiErrorCode(err) === "PLAN_CLIENT_LIMIT") {
        setFormError(null);
        toast.error(getApiErrorMessage(err, "Dostignut je limit klijenata."), {
          action: {
            label: "Pretplata",
            onClick: () => router.push("/subscribe"),
          },
        });
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
            Lista klijenata. Unesi <strong>e-mail</strong> za slanje podsetnika
            i potvrda termina (ako je u podešavanjima uključen e-mail). Karton:
            prilozi se čuvaju u <strong>folderu tog klijenta</strong> na serveru;
            ceo folder se briše kad obrišeš klijenta.
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
              : "border-zinc-200/90 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40"
          )}
        >
          <span className="text-zinc-700 dark:text-zinc-300">
            {clientLimits.plan === "pro"
              ? "Pro plan"
              : clientLimits.plan === "basic"
                ? "Basic plan"
                : "Besplatan plan"}{" "}
            ·{" "}
            <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
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
        <SurfaceCard padding="none" className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-zinc-200/90 bg-zinc-50/50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className={appTableHeadClass}>
                  <th className="px-5 py-3.5">Ime</th>
                  <th className="px-5 py-3.5">Telefon</th>
                  <th className="hidden px-5 py-3.5 lg:table-cell">E-mail</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">
                    Poslednji kontekst
                  </th>
                  <th className="px-5 py-3.5">Registrovan</th>
                  <th className="w-44 px-5 py-3.5 text-right">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : rows.length === 0 ? (
        <SurfaceCard padding="lg" className="border-dashed text-center text-sm text-zinc-600 dark:text-zinc-400">
          Još nema klijenata. Klikni „+ Novi klijent“.
        </SurfaceCard>
      ) : (
        <SurfaceCard padding="none" className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-zinc-200/90 bg-zinc-50/50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraga: ime, telefon, e-mail, beleška…"
              className="max-w-md rounded-xl border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
              aria-label="Pretraga klijenata"
            />
            <p className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {filteredRows.length} od {rows.length}
              {clientsTv.enabled && filteredRows.length > 0
                ? ` · prikaz ${clientsTv.from + 1}–${clientsTv.to}`
                : null}
            </p>
          </div>
          <div
            ref={clientsTableScrollRef}
            className={cn(
              "overflow-x-auto",
              filteredRows.length >= 45 && "max-h-[min(70vh,560px)] overflow-y-auto"
            )}
          >
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead
                className={cn(
                  appTableHeadClass,
                  "sticky top-0 z-20 bg-zinc-50/95 backdrop-blur-sm dark:bg-zinc-900/95",
                  clientsHeadShadow &&
                    "shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] dark:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.45)]"
                )}
              >
                <tr className="border-b border-zinc-200/90 dark:border-zinc-800">
                  <th className="px-5 py-3.5">Ime</th>
                  <th className="px-5 py-3.5">Telefon</th>
                  <th className="hidden px-5 py-3.5 lg:table-cell">E-mail</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">
                    Poslednji kontekst
                  </th>
                  <th className="px-5 py-3.5">Registrovan</th>
                  <th className="w-44 px-5 py-3.5 text-right">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      Nema rezultata za „{search.trim()}“. Pokušaj drugu
                      pretragu.
                    </td>
                  </tr>
                ) : (
                  <>
                    {showClientsVirtual && clientsTv.topSpacer > 0 ? (
                      <tr aria-hidden>
                        <td
                          colSpan={6}
                          style={{
                            height: clientsTv.topSpacer,
                            padding: 0,
                            border: 0,
                          }}
                        />
                      </tr>
                    ) : null}
                    {visibleClients.map((c) => (
                    <tr
                      key={c.id}
                      className={cn(
                        appTableRowClass,
                        "box-border h-[52px] max-h-[52px]",
                        isNewClient(c) &&
                          "bg-amber-50/55 dark:bg-amber-950/25",
                        tableEditId === c.id &&
                          "bg-sky-50/50 ring-1 ring-sky-200/60 dark:bg-sky-950/20 dark:ring-sky-800/50"
                      )}
                    >
                      <td className="h-[52px] max-h-[52px] overflow-hidden px-5 py-1 align-middle font-medium text-zinc-900 dark:text-zinc-100">
                        {tableEditId === c.id ? (
                          <Input
                            value={tableDraft.name}
                            onChange={(e) =>
                              setTableDraft((d) => ({
                                ...d,
                                name: e.target.value,
                              }))
                            }
                            className="h-8 rounded-lg text-sm"
                            aria-label="Ime klijenta"
                          />
                        ) : (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {c.name}
                            {isNewClient(c) ? (
                              <Badge
                                variant="secondary"
                                className="rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
                              >
                                Novo
                              </Badge>
                            ) : null}
                          </span>
                        )}
                      </td>
                      <td className="h-[52px] max-h-[52px] overflow-hidden px-5 py-1 align-middle tabular-nums text-zinc-700 dark:text-zinc-300">
                        {tableEditId === c.id ? (
                          <Input
                            value={tableDraft.phone}
                            onChange={(e) =>
                              setTableDraft((d) => ({
                                ...d,
                                phone: e.target.value,
                              }))
                            }
                            className="h-8 rounded-lg text-sm"
                            inputMode="tel"
                            aria-label="Telefon"
                          />
                        ) : (
                          (c.phone ?? "—")
                        )}
                      </td>
                      <td className="hidden h-[52px] max-h-[52px] overflow-hidden px-5 py-1 align-middle lg:table-cell lg:max-w-[14rem]">
                        {tableEditId === c.id ? (
                          <Input
                            value={tableDraft.email}
                            onChange={(e) =>
                              setTableDraft((d) => ({
                                ...d,
                                email: e.target.value,
                              }))
                            }
                            className="h-8 rounded-lg text-sm"
                            type="email"
                            placeholder="E-mail (opciono)"
                            aria-label="E-mail"
                          />
                        ) : (
                          <span className="truncate text-zinc-600 dark:text-zinc-400">
                            {c.email?.trim() ? c.email.trim() : "—"}
                          </span>
                        )}
                      </td>
                      <td className="hidden h-[52px] max-h-[52px] truncate px-5 py-1 align-middle text-zinc-600 md:table-cell md:max-w-xs dark:text-zinc-400">
                        {c.notes ?? "—"}
                      </td>
                      <td className="h-[52px] max-h-[52px] px-5 py-1 align-middle text-zinc-600 dark:text-zinc-400">
                        {formatDateShort(c.created_at)}
                      </td>
                      <td className="h-[52px] max-h-[52px] px-5 py-1 align-middle text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {tableEditId === c.id ? (
                            <>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-xl text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                                disabled={tableSaving}
                                onClick={() => void saveTableEdit()}
                                aria-label="Sačuvaj izmenu"
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-xl"
                                disabled={tableSaving}
                                onClick={cancelTableEdit}
                                aria-label="Otkaži izmenu"
                              >
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-xl"
                                onClick={() => startTableEdit(c)}
                                aria-label="Izmeni u tabeli"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-zinc-200 dark:border-zinc-700"
                                onClick={() => void openCard(c.id)}
                              >
                                Karton
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))}
                    {showClientsVirtual && clientsTv.bottomSpacer > 0 ? (
                      <tr aria-hidden>
                        <td
                          colSpan={6}
                          style={{
                            height: clientsTv.bottomSpacer,
                            padding: 0,
                            border: 0,
                          }}
                        />
                      </tr>
                    ) : null}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="border-zinc-200 sm:max-w-md dark:border-zinc-800"
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
          className="flex max-h-[90vh] flex-col border-zinc-200 sm:max-w-3xl dark:border-zinc-800"
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
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Učitavanje kartice…
            </p>
          ) : null}

          {detail ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-zinc-200/90 pb-2 dark:border-zinc-800">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCardTab(t.id)}
                    className={cn(
                      "shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      cardTab === t.id
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
                            className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/40"
                          >
                            <p className="font-medium text-zinc-900 dark:text-zinc-50">
                              {b.program_name}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
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
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Nema aktivnog loyalty programa ili još nema stanja za
                        ovog klijenta. Podesi program u{" "}
                        <strong>Podešavanja → Loyalty</strong>.
                      </p>
                    )}
                  </div>
                ) : null}

                {cardTab === "osnovno" ? (
                  <div className="space-y-4 py-2">
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
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
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
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {user?.role === "worker"
                            ? "Brisanje klijenata nije dozvoljeno za tvoj nalog. Administrator može da uključi dozvolu u Podešavanja → Sigurnost."
                            : "Brisanje nije dostupno."}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {cardTab === "istorija" ? (
                  <div className="space-y-3 py-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Zakazivanja iz kalendara za ovog klijenta.
                    </p>
                    {detail.appointments.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        Nema zapisa.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.appointments.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                          >
                            <div className="font-medium text-zinc-900 dark:text-zinc-50">
                              {a.service_name}
                            </div>
                            <div className="text-zinc-600 dark:text-zinc-400">
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
                      className="space-y-3 rounded-2xl border border-zinc-200/90 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <h3 className="font-heading text-sm font-semibold text-zinc-900 dark:text-zinc-50">
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
                            className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
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
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
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
                      <h3 className="font-heading mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Istorija kartona
                      </h3>
                      {detail.chart_entries.length === 0 ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-500">
                          Još nema unosa u karton.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {detail.chart_entries.map((e) => (
                            <li
                              key={e.id}
                              className="rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
                            >
                              <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                {e.title || "Bez naslova"}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {formatDt(e.visit_at)}
                                {e.appointment_id
                                  ? ` · termin #${e.appointment_id}`
                                  : ""}
                              </div>
                              {e.notes ? (
                                <p className="mt-2 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                                  {e.notes}
                                </p>
                              ) : null}
                              {e.attachments?.length ? (
                                <ul className="mt-2 space-y-1">
                                  {e.attachments.map((f) => (
                                    <li key={f.id}>
                                      <button
                                        type="button"
                                        className="text-left text-zinc-700 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
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
          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="border-b border-zinc-200/90 bg-zinc-50/50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:px-5">
              <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className={appTableHeadClass}>
                    <th className="px-5 py-3.5">Ime</th>
                    <th className="px-5 py-3.5">Telefon</th>
                    <th className="hidden px-5 py-3.5 lg:table-cell">E-mail</th>
                    <th className="hidden px-5 py-3.5 md:table-cell">
                      Kontekst
                    </th>
                    <th className="px-5 py-3.5">Registrovan</th>
                    <th className="w-44 px-5 py-3.5 text-right">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      }
    >
      <ClientsPageContent />
    </Suspense>
  );
}
