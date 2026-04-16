"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { createService, getServices, updateService } from "@/lib/api";
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
import { cn } from "@/lib/utils";
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <SurfaceCard
              key={s.id}
              padding="md"
              className={cn(
                "group flex flex-col justify-between",
                editingId === s.id &&
                  "ring-2 ring-sky-300/70 dark:ring-sky-700/60"
              )}
            >
              {editingId === s.id && canManage ? (
                <div className="flex flex-col gap-3">
                  {editError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                      {editError}
                    </p>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor={`e-name-${s.id}`}>Naziv</Label>
                    <Input
                      id={`e-name-${s.id}`}
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`e-price-${s.id}`}>Cena (RSD)</Label>
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
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`e-dur-${s.id}`}>Trajanje</Label>
                      <Input
                        id={`e-dur-${s.id}`}
                        type="number"
                        min={1}
                        step={1}
                        value={draft.duration}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, duration: e.target.value }))
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`e-buf-${s.id}`}>Buffer</Label>
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
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
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
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        {s.name}
                      </h3>
                      <p className="mt-3 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatRsd(s.price)}
                      </p>
                    </div>
                    {canManage ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="shrink-0 rounded-xl opacity-80 transition-opacity group-hover:opacity-100"
                        onClick={() => startEdit(s)}
                        aria-label="Izmeni uslugu"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Trajanje
                      </dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                        {s.duration} min
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Buffer
                      </dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                        {s.buffer_minutes ?? 0} min
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </SurfaceCard>
          ))}
        </div>
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
