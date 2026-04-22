"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createSupplyItem,
  createSupplyMovement,
  deleteSupplyItem,
  getSupplyItems,
  getSupplyMovements,
  patchSupplyItem,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
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
import { SurfaceCard } from "@/components/ui/surface-card";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import { useAuth } from "@/providers/auth-provider";
import type { SupplyItem, SupplyMovement } from "@/types/supply";
import { cn } from "@/lib/utils";

function formatQty(q: number): string {
  const n = Number(q);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n - Math.round(n)) < 1e-9) {
    return String(Math.round(n));
  }
  return n.toLocaleString("sr-Latn-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function movementLabel(t: SupplyMovement["movement_type"]): string {
  if (t === "purchase") return "Nabavka";
  if (t === "usage") return "Potrošnja";
  return "Korekcija";
}

export default function SuppliesPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<SupplyItem[]>([]);
  const [movements, setMovements] = useState<SupplyMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("kom");
  const [newReorder, setNewReorder] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  const [movOpen, setMovOpen] = useState(false);
  const [movItemId, setMovItemId] = useState<number | null>(null);
  const [movType, setMovType] = useState<"purchase" | "usage" | "adjustment">(
    "usage"
  );
  const [movQty, setMovQty] = useState("");
  const [movTarget, setMovTarget] = useState("");
  const [movNote, setMovNote] = useState("");
  const [movSaving, setMovSaving] = useState(false);

  const [delId, setDelId] = useState<number | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, movRes] = await Promise.all([
        getSupplyItems(),
        getSupplyMovements({ limit: 100 }),
      ]);
      setRows(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setMovements(Array.isArray(movRes.data) ? movRes.data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, "Podaci nisu učitani."));
      setRows([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || user?.role !== "admin") {
      return;
    }
    void reload();
  }, [authLoading, user?.role, reload]);

  const lowStockIds = useMemo(() => {
    const s = new Set<number>();
    for (const r of rows) {
      if (
        r.reorder_min != null &&
        r.quantity <= r.reorder_min
      ) {
        s.add(r.id);
      }
    }
    return s;
  }, [rows]);

  async function onCreateItem() {
    const name = newName.trim();
    if (!name) {
      toast.error("Unesi naziv materijala.");
      return;
    }
    setCreateSaving(true);
    try {
      const reorder =
        newReorder.trim() === ""
          ? null
          : Number.parseFloat(newReorder.replace(",", "."));
      await createSupplyItem({
        name,
        unit: newUnit.trim() || "kom",
        reorder_min:
          reorder != null && !Number.isNaN(reorder) && reorder >= 0
            ? reorder
            : null,
      });
      toast.success("Stavka je dodata.");
      setCreateOpen(false);
      setNewName("");
      setNewUnit("kom");
      setNewReorder("");
      await reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Čuvanje nije uspelo."));
    } finally {
      setCreateSaving(false);
    }
  }

  function openMovement(itemId: number) {
    setMovItemId(itemId);
    setMovType("usage");
    setMovQty("");
    setMovTarget("");
    setMovNote("");
    setMovOpen(true);
  }

  async function onSaveMovement() {
    if (movItemId == null) return;
    setMovSaving(true);
    try {
      const body: Parameters<typeof createSupplyMovement>[0] = {
        supply_item_id: movItemId,
        movement_type: movType,
        note: movNote.trim() || null,
      };
      if (movType === "adjustment") {
        const t = Number.parseFloat(movTarget.replace(",", "."));
        if (Number.isNaN(t) || t < 0) {
          toast.error("Unesi ispravnu novu količinu (≥ 0).");
          return;
        }
        body.target_quantity = t;
      } else {
        const q = Number.parseFloat(movQty.replace(",", "."));
        if (Number.isNaN(q) || q <= 0) {
          toast.error("Unesi količinu veću od 0.");
          return;
        }
        body.quantity = q;
      }
      const { data } = await createSupplyMovement(body);
      if (data.skipped) {
        toast.message("Količina je već na tom nivou — nema promene.");
      } else {
        toast.success("Stanje je ažurirano.");
      }
      setMovOpen(false);
      await reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Promena nije sačuvana."));
    } finally {
      setMovSaving(false);
    }
  }

  async function onDelete(id: number) {
    setDelBusy(true);
    try {
      await deleteSupplyItem(id);
      toast.success("Stavka je obrisana (uključujući istoriju kretanja).");
      setDelId(null);
      await reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Brisanje nije uspelo."));
    } finally {
      setDelBusy(false);
    }
  }

  async function onPatchReorder(item: SupplyItem, raw: string) {
    const v =
      raw.trim() === ""
        ? null
        : Number.parseFloat(raw.replace(",", "."));
    if (v != null && (Number.isNaN(v) || v < 0)) {
      toast.error("Minimalni nivo mora biti ≥ 0 ili prazno.");
      return;
    }
    try {
      await patchSupplyItem(item.id, { reorder_min: v });
      await reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Izmena nije sačuvana."));
    }
  }

  if (authLoading || !user) {
    return (
      <p className="text-sm text-muted-foreground">Učitavanje…</p>
    );
  }

  if (user.role === "worker") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Potrošni materijal" />
        <SurfaceCard
          padding="lg"
          className="text-center text-sm text-muted-foreground"
        >
          <p>Ovaj odeljak je dostupan samo administratoru salona.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block font-semibold text-primary underline-offset-2 hover:underline"
          >
            Nazad na dashboard
          </Link>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Potrošni materijal"
        description="Unutrašnje zalihe (kozmetika za potrošnju, pribor, potrošni materijal) — nabavka, potrošnja i inventurna korekcija. Nije maloprodaja klijentima."
        action={
          <Button
            type="button"
            className="touch-manipulation"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 size-4" aria-hidden />
            Nova stavka
          </Button>
        }
      />

      {error ? (
        <SurfaceCard
          padding="md"
          className="border-destructive/40 bg-destructive/5 text-destructive"
        >
          {error}
        </SurfaceCard>
      ) : null}

      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Stanje zaliha
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Količina može imati decimale (npr. litri, kilogrami). Brisanje stavke
            briše i istoriju kretanja za tu stavku.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={appTableHeadClass}>
              <tr>
                <th className="px-5 py-3.5">Materijal</th>
                <th className="px-5 py-3.5">Jedinica</th>
                <th className="px-5 py-3.5 text-right">Stanje</th>
                <th className="px-5 py-3.5">Min. nivo</th>
                <th className="px-5 py-3.5 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    Učitavanje…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    Nema unetih stavki. Dodaj prvu (npr. „Jednokratni peškir“,
                    „Ulje za masažu — potrošnja“).
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className={appTableRowClass}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {lowStockIds.has(r.id) ? (
                          <AlertTriangle
                            className="size-4 shrink-0 text-amber-600"
                            aria-hidden
                          />
                        ) : (
                          <Package
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        )}
                        <span className="font-medium text-foreground">
                          {r.name}
                        </span>
                      </div>
                      {r.notes ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {r.unit}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                      {formatQty(r.quantity)}
                    </td>
                    <td className="px-5 py-3">
                      <Input
                        className="h-9 max-w-[7rem]"
                        defaultValue={
                          r.reorder_min != null ? formatQty(r.reorder_min) : ""
                        }
                        placeholder="—"
                        onBlur={(e) => {
                          void onPatchReorder(r, e.target.value);
                        }}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="touch-manipulation"
                          onClick={() => openMovement(r.id)}
                        >
                          Promena zaliha
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDelId(r.id)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Istorija kretanja
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Poslednjih do 100 unosa.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className={appTableHeadClass}>
              <tr>
                <th className="px-5 py-3.5">Vreme</th>
                <th className="px-5 py-3.5">Stavka</th>
                <th className="px-5 py-3.5">Tip</th>
                <th className="px-5 py-3.5 text-right">Δ</th>
                <th className="px-5 py-3.5">Napomena</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-muted-foreground"
                  >
                    Još nema kretanja.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className={appTableRowClass}>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {new Date(m.created_at).toLocaleString("sr-Latn-RS")}
                    </td>
                    <td className="px-5 py-2.5">{m.item_name ?? `#${m.supply_item_id}`}</td>
                    <td className="px-5 py-2.5">
                      {movementLabel(m.movement_type)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-2.5 text-right tabular-nums font-medium",
                        m.delta_qty > 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : m.delta_qty < 0
                            ? "text-red-700 dark:text-red-400"
                            : "text-muted-foreground"
                      )}
                    >
                      {m.delta_qty > 0 ? "+" : ""}
                      {formatQty(m.delta_qty)}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-2.5 text-xs text-muted-foreground">
                      {m.note ?? "—"}
                      {m.appointment_id ? ` · termin #${m.appointment_id}` : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova stavka zalihe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="sn">Naziv</Label>
              <Input
                id="sn"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="npr. Higijenski uložak za krevet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su">Jedinica mere</Label>
              <Input
                id="su"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="kom, l, ml, kg…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sr">Upozorenje ispod nivoa (opciono)</Label>
              <Input
                id="sr"
                value={newReorder}
                onChange={(e) => setNewReorder(e.target.value)}
                inputMode="decimal"
                placeholder="npr. 5"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Otkaži
            </Button>
            <Button
              type="button"
              disabled={createSaving}
              onClick={() => void onCreateItem()}
            >
              Sačuvaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={movOpen} onOpenChange={setMovOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promena zaliha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tip</Label>
              <select
                className="flex h-10 w-full rounded-xl border border-border bg-[var(--smp-input-bg)] px-3 text-sm"
                value={movType}
                onChange={(e) =>
                  setMovType(e.target.value as typeof movType)
                }
              >
                <option value="purchase">Nabavka (ulaz +)</option>
                <option value="usage">Potrošnja (izlaz −)</option>
                <option value="adjustment">Korekcija / inventura (nova količina)</option>
              </select>
            </div>
            {movType === "adjustment" ? (
              <div className="space-y-2">
                <Label htmlFor="mt">Nova količina na stanju</Label>
                <Input
                  id="mt"
                  value={movTarget}
                  onChange={(e) => setMovTarget(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="mq">Količina</Label>
                <Input
                  id="mq"
                  value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mn">Napomena (opciono)</Label>
              <Input
                id="mn"
                value={movNote}
                onChange={(e) => setMovNote(e.target.value)}
                placeholder="npr. Dobavljač XY, potrošeno za tretmane"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMovOpen(false)}
            >
              Otkaži
            </Button>
            <Button
              type="button"
              disabled={movSaving}
              onClick={() => void onSaveMovement()}
            >
              Primeni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId != null} onOpenChange={(o) => !o && setDelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Obrisati stavku?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sva istorija kretanja za ovu stavku biće trajno obrisana.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDelId(null)}>
              Otkaži
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={delBusy}
              onClick={() => delId != null && void onDelete(delId)}
            >
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
