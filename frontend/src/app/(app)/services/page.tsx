"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createService, deleteService, getServices, updateService } from "@/lib/api";
import { notifyApp } from "@/lib/notifications-store";
import { useAuth } from "@/providers/auth-provider";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ServiceCardSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRsd } from "@/lib/formatMoney";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import { cn } from "@/lib/utils";
import { useTableHeadShadow } from "@/hooks/useTableHeadShadow";
import { useTableViewportWindow } from "@/hooks/useTableViewportWindow";
import type { Service } from "@/types/service";

function ServicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [bufferMinutes, setBufferMinutes] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    price: "",
    duration: "",
    buffer: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const servicesScrollRef = useRef<HTMLDivElement>(null);
  const servicesHeadShadow = useTableHeadShadow(servicesScrollRef);
  const editingRowIndex = useMemo(() => {
    if (editingId == null) {
      return null;
    }
    const ix = rows.findIndex((r) => r.id === editingId);
    return ix >= 0 ? ix : null;
  }, [editingId, rows]);
  const servicesTv = useTableViewportWindow(
    servicesScrollRef,
    rows.length,
    52,
    {
      minItems: editingId != null ? 100_000 : 45,
      pinIndex: editingRowIndex,
    }
  );
  const visibleServices = servicesTv.enabled
    ? rows.slice(servicesTv.from, servicesTv.to)
    : rows;

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const { data } = await getServices();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, "Usluge nisu učitane."));
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
    if (searchParams.get("new") === "1" && canManage) {
      setOpen(true);
      router.replace("/services", { scroll: false });
    }
  }, [searchParams, canManage, router]);

  function startEdit(s: Service) {
    setEditError(null);
    setEditingId(s.id);
    setDraft({
      name: s.name,
      price: String(s.price),
      duration: String(s.duration),
      buffer: String(s.buffer_minutes ?? 0),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function removeService(s: Service) {
    const ok = window.confirm(
      `Obrisati uslugu „${s.name}“?\n\n` +
        "Ako postoje termini (bilo koji status) za ovu uslugu, brisanje neće proći dok ih ne obrišeš ili ne promeniš uslugu na tim terminima. " +
        "Loyalty program vezan za ovu uslugu biće uklonjen zajedno sa uslugom."
    );
    if (!ok) {
      return;
    }
    setDeletingId(s.id);
    try {
      await deleteService(s.id);
      if (editingId === s.id) {
        setEditingId(null);
      }
      toast.success("Usluga je obrisana.");
      await load({ silent: true });
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Brisanje nije uspelo (proveri da li postoje termini za ovu uslugu)."
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function saveEdit() {
    if (editingId == null) {
      return;
    }
    setEditError(null);
    const p = Number.parseFloat(draft.price.replace(",", "."));
    const d = Number.parseInt(draft.duration, 10);
    const buf = Number.parseInt(draft.buffer, 10);
    if (!draft.name.trim() || draft.name.trim().length < 2) {
      setEditError("Naziv min. 2 karaktera.");
      return;
    }
    if (Number.isNaN(p) || p < 0) {
      setEditError("Unesi ispravnu cenu (RSD).");
      return;
    }
    if (Number.isNaN(d) || d < 1) {
      setEditError("Trajanje min. 1 minut.");
      return;
    }
    if (Number.isNaN(buf) || buf < 0 || buf > 240) {
      setEditError("Buffer 0–240 min.");
      return;
    }
    setEditSaving(true);
    try {
      await updateService(editingId, {
        name: draft.name.trim(),
        price: p,
        duration: d,
        buffer_minutes: buf,
      });
      setEditingId(null);
      await load({ silent: true });
    } catch (err) {
      setEditError(getApiErrorMessage(err, "Izmena nije sačuvana."));
    } finally {
      setEditSaving(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const p = Number.parseFloat(price.replace(",", "."));
    const d = Number.parseInt(duration, 10);
    const buf = Number.parseInt(bufferMinutes, 10);
    if (!name.trim() || name.trim().length < 2) {
      setFormError("Naziv min. 2 karaktera.");
      return;
    }
    if (Number.isNaN(p) || p < 0) {
      setFormError("Unesi ispravnu cenu (RSD).");
      return;
    }
    if (Number.isNaN(d) || d < 1) {
      setFormError("Trajanje min. 1 minut.");
      return;
    }
    if (Number.isNaN(buf) || buf < 0 || buf > 240) {
      setFormError("Buffer 0–240 min.");
      return;
    }
    setSaving(true);
    try {
      await createService({
        name: name.trim(),
        price: p,
        duration: d,
        buffer_minutes: buf,
      });
      toast.success("Usluga je sačuvana.");
      notifyApp({
        title: "Nova usluga",
        body: `${name.trim()} · ${formatRsd(p)}`,
        href: "/services",
      });
      setOpen(false);
      setName("");
      setPrice("");
      setDuration("60");
      setBufferMinutes("0");
      await load({ silent: true });
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Usluga nije kreirana."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Usluge"
        description="Naziv, cena u RSD, trajanje i buffer (pauza posle termina) za kalendar."
        action={
          canManage ? (
            <Button type="button" onClick={() => setOpen(true)}>
              + Nova usluga
            </Button>
          ) : null
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <SurfaceCard
          padding="lg"
          className="border-dashed text-center text-sm text-zinc-600 dark:text-zinc-400"
        >
          {canManage
            ? "Nema usluga. Dodaj bar jednu za zakazivanje."
            : "Nema usluga. Administrator treba da doda usluge u salonu."}
        </SurfaceCard>
      ) : (
        <SurfaceCard padding="none" className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-zinc-200/90 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {rows.length}{" "}
              {rows.length === 1 ? "usluga" : "usluga"}
              {servicesTv.enabled && rows.length > 0
                ? ` · prikaz ${servicesTv.from + 1}–${servicesTv.to}`
                : null}
            </p>
          </div>
          <div
            ref={servicesScrollRef}
            className={cn(
              "overflow-x-auto",
              rows.length >= 45 &&
                editingId == null &&
                "max-h-[min(70vh,560px)] overflow-y-auto"
            )}
          >
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead
                className={cn(
                  appTableHeadClass,
                  "sticky top-0 z-20 bg-zinc-50/95 backdrop-blur-sm dark:bg-zinc-900/95",
                  servicesHeadShadow &&
                    "shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] dark:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.45)]"
                )}
              >
                <tr className="border-b border-zinc-200/90 dark:border-zinc-800">
                  <th className="px-4 py-3.5 sm:px-5">Naziv</th>
                  <th className="px-4 py-3.5 sm:px-5 text-right">Cena</th>
                  <th className="px-4 py-3.5 sm:px-5 text-right">Trajanje</th>
                  <th className="px-4 py-3.5 sm:px-5 text-right">Buffer</th>
                  {canManage ? (
                    <th className="w-36 px-4 py-3.5 text-right sm:px-5">
                      Akcije
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {servicesTv.topSpacer > 0 ? (
                  <tr aria-hidden>
                    <td
                      colSpan={canManage ? 5 : 4}
                      style={{
                        height: servicesTv.topSpacer,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                ) : null}
                {visibleServices.map((s) =>
                  editingId === s.id && canManage ? (
                    <tr
                      key={s.id}
                      className={cn(
                        appTableRowClass,
                        "bg-sky-50/60 dark:bg-sky-950/25"
                      )}
                    >
                      <td className="px-4 py-3 align-top sm:px-5">
                        <div className="space-y-1.5">
                          {editError ? (
                            <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                              {editError}
                            </p>
                          ) : null}
                          <Label
                            htmlFor={`e-name-${s.id}`}
                            className="sr-only"
                          >
                            Naziv
                          </Label>
                          <Input
                            id={`e-name-${s.id}`}
                            value={draft.name}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, name: e.target.value }))
                            }
                            className="h-9 rounded-lg text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top sm:px-5">
                        <Label
                          htmlFor={`e-price-${s.id}`}
                          className="sr-only"
                        >
                          Cena
                        </Label>
                        <Input
                          id={`e-price-${s.id}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={1}
                          value={draft.price}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, price: e.target.value }))
                          }
                          className="h-9 rounded-lg text-sm tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-3 align-top sm:px-5">
                        <Label htmlFor={`e-dur-${s.id}`} className="sr-only">
                          Trajanje
                        </Label>
                        <Input
                          id={`e-dur-${s.id}`}
                          type="number"
                          min={1}
                          step={1}
                          value={draft.duration}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              duration: e.target.value,
                            }))
                          }
                          className="h-9 rounded-lg text-sm tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-3 align-top sm:px-5">
                        <Label htmlFor={`e-buf-${s.id}`} className="sr-only">
                          Buffer
                        </Label>
                        <Input
                          id={`e-buf-${s.id}`}
                          type="number"
                          min={0}
                          max={240}
                          step={1}
                          value={draft.buffer}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, buffer: e.target.value }))
                          }
                          className="h-9 rounded-lg text-sm tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-3 align-top text-right sm:px-5">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-xl text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                            disabled={editSaving}
                            onClick={() => void saveEdit()}
                            aria-label="Sačuvaj uslugu"
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-xl"
                            disabled={editSaving}
                            onClick={cancelEdit}
                            aria-label="Otkaži"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={s.id}
                      className={cn(appTableRowClass, "h-[52px]")}
                    >
                      <td className="max-w-[220px] truncate px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50 sm:px-5">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-900 dark:text-zinc-100 sm:px-5">
                        {formatRsd(s.price)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300 sm:px-5">
                        {s.duration} min
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300 sm:px-5">
                        {s.buffer_minutes ?? 0} min
                      </td>
                      {canManage ? (
                        <td className="px-4 py-3 text-right sm:px-5">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-xl"
                              onClick={() => startEdit(s)}
                              aria-label="Izmeni uslugu"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-xl text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50"
                              disabled={deletingId === s.id}
                              onClick={() => void removeService(s)}
                              aria-label="Obriši uslugu"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  )
                )}
                {servicesTv.bottomSpacer > 0 ? (
                  <tr aria-hidden>
                    <td
                      colSpan={canManage ? 5 : 4}
                      style={{
                        height: servicesTv.bottomSpacer,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {canManage ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="border-zinc-200 sm:max-w-md dark:border-zinc-800"
            showCloseButton
          >
            <form onSubmit={onCreate}>
              <DialogHeader>
                <DialogTitle>Nova usluga</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                {formError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {formError}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="sv-name">Naziv</Label>
                  <Input
                    id="sv-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sv-price">Cena (RSD)</Label>
                  <Input
                    id="sv-price"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sv-dur">Trajanje (min)</Label>
                  <Input
                    id="sv-dur"
                    type="number"
                    min={1}
                    step={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sv-buf">Buffer posle termina (min)</Label>
                  <Input
                    id="sv-buf"
                    type="number"
                    min={0}
                    max={240}
                    step={1}
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(e.target.value)}
                    required
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
      ) : null}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8">
          <SectionHeader
            title="Usluge"
            description="Učitavanje usluga…"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}
