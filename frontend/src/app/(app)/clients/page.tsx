"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createClient,
  createClientChartEntry,
  deleteClient,
  downloadClientChartFile,
  getClientDetail,
  getClients,
  updateClient,
} from "@/lib/api";
import { appointmentStaffLabel } from "@/components/calendar/calendar-utils";
import { getApiErrorMessage } from "@/lib/api/errors";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
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
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import type {
  Client,
  ClientChartEntry,
  ClientDetail,
} from "@/types/client";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type CardTab = "osnovno" | "istorija" | "karton";

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

export default function ClientsPage() {
  const { user } = useAuth();
  const { settings } = useOrganization();
  const allowDelete = canDeleteRecords(user, settings);

  const [rows, setRows] = useState<Client[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getClients();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, "Klijenti nisu učitani."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Klijent nije kreiran."));
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
      await load();
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
      await load();
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
          <Button type="button" variant="brand" onClick={() => setOpen(true)}>
            + Novi klijent
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
      ) : rows.length === 0 ? (
        <SurfaceCard padding="lg" className="border-dashed text-center text-sm text-slate-600 dark:text-slate-400">
          Još nema klijenata. Klikni „+ Novi klijent“.
        </SurfaceCard>
      ) : (
        <SurfaceCard padding="none" className="overflow-hidden">
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
                  <th className="w-36 px-5 py-3.5 text-right">Kartica</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={appTableRowClass}>
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-700 dark:text-slate-300">
                      {c.phone ?? "—"}
                    </td>
                    <td className="hidden max-w-[14rem] truncate px-5 py-3.5 text-slate-600 lg:table-cell dark:text-slate-400">
                      {c.email?.trim() ? c.email.trim() : "—"}
                    </td>
                    <td className="hidden max-w-xs truncate px-5 py-3.5 text-slate-600 md:table-cell dark:text-slate-400">
                      {c.notes ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {formatDateShort(c.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200"
                        onClick={() => void openCard(c.id)}
                      >
                        Otvori
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-sky-100 sm:max-w-md" showCloseButton>
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
              <Button type="submit" variant="brand" disabled={saving}>
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
          className="flex max-h-[90vh] flex-col border-sky-100 sm:max-w-3xl"
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
            <p className="text-sm text-sky-700">Učitavanje kartice…</p>
          ) : null}

          {detail ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-sky-100 pb-2">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCardTab(t.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-2 text-xs font-medium sm:text-sm",
                      cardTab === t.id
                        ? "bg-sky-600 text-white"
                        : "text-sky-800 hover:bg-sky-50"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                        className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="brand"
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
                        <p className="text-sm text-sky-700">
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
                    <p className="text-sm text-sky-700">
                      Zakazivanja iz kalendara za ovog klijenta.
                    </p>
                    {detail.appointments.length === 0 ? (
                      <p className="text-sm text-sky-600">Nema zapisa.</p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.appointments.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2 text-sm"
                          >
                            <div className="font-medium text-sky-950">
                              {a.service_name}
                            </div>
                            <div className="text-sky-700">
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
                    <form onSubmit={onSaveKarton} className="space-y-3 rounded-lg border border-sky-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-sky-950">
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
                            className="flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 text-sm"
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
                          className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm"
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
                      <Button type="submit" variant="brand" disabled={kSaving}>
                        {kSaving ? "Čuvam…" : "Dodaj u karton"}
                      </Button>
                    </form>

                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-sky-950">
                        Istorija kartona
                      </h3>
                      {detail.chart_entries.length === 0 ? (
                        <p className="text-sm text-sky-600">
                          Još nema unosa u karton.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {detail.chart_entries.map((e) => (
                            <li
                              key={e.id}
                              className="rounded-lg border border-sky-100 bg-sky-50/30 p-3 text-sm"
                            >
                              <div className="font-medium text-sky-950">
                                {e.title || "Bez naslova"}
                              </div>
                              <div className="text-xs text-sky-600">
                                {formatDt(e.visit_at)}
                                {e.appointment_id
                                  ? ` · termin #${e.appointment_id}`
                                  : ""}
                              </div>
                              {e.notes ? (
                                <p className="mt-2 whitespace-pre-wrap text-sky-800">
                                  {e.notes}
                                </p>
                              ) : null}
                              {e.attachments?.length ? (
                                <ul className="mt-2 space-y-1">
                                  {e.attachments.map((f) => (
                                    <li key={f.id}>
                                      <button
                                        type="button"
                                        className="text-left text-sky-700 underline hover:text-sky-900"
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
