"use client";

import { useCallback, useEffect, useState } from "react";
import { createService, getServices } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { getApiErrorMessage } from "@/lib/api/errors";
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
import { formatRsd } from "@/lib/formatMoney";
import type { Service } from "@/types/service";

export default function ServicesPage() {
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getServices();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, "Usluge nisu učitane."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      setOpen(false);
      setName("");
      setPrice("");
      setDuration("60");
      setBufferMinutes("0");
      await load();
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
            <Button type="button" variant="brand" onClick={() => setOpen(true)}>
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
        <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
      ) : rows.length === 0 ? (
        <SurfaceCard padding="lg" className="border-dashed text-center text-sm text-slate-600 dark:text-slate-400">
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
              className="group flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {s.name}
                </h3>
                <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatRsd(s.price)}
                </p>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-700">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Trajanje
                  </dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-slate-800 dark:text-slate-200">
                    {s.duration} min
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Buffer
                  </dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-slate-800 dark:text-slate-200">
                    {s.buffer_minutes ?? 0} min
                  </dd>
                </div>
              </dl>
            </SurfaceCard>
          ))}
        </div>
      )}

      {canManage ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="border-sky-100 sm:max-w-md" showCloseButton>
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
                <Button
                  type="submit"
                  variant="brand"
                  disabled={saving}
                >
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
