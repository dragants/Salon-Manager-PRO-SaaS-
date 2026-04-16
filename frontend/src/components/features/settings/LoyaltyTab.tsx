"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createLoyaltyProgram,
  deleteLoyaltyProgram,
  getLoyaltyPrograms,
  getServices,
  patchLoyaltyProgram,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsCard } from "./SettingsCard";
import type { LoyaltyProgram } from "@/types/loyalty";
import type { Service } from "@/types/service";

export function LoyaltyTab() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [svcId, setSvcId] = useState("");
  const [name, setName] = useState("");
  const [visits, setVisits] = useState("10");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getLoyaltyPrograms(), getServices()]);
      setPrograms(Array.isArray(p.data) ? p.data : []);
      setServices(Array.isArray(s.data) ? s.data : []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Loyalty podaci nisu učitani."));
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd() {
    const sid = Number(svcId);
    if (!sid) {
      toast.error("Izaberi uslugu.");
      return;
    }
    const n = name.trim();
    if (!n) {
      toast.error("Unesi naziv programa.");
      return;
    }
    const v = Number.parseInt(visits, 10);
    if (Number.isNaN(v) || v < 2 || v > 365) {
      toast.error("Broj poseta mora biti između 2 i 365.");
      return;
    }
    setSaving(true);
    try {
      await createLoyaltyProgram({
        service_id: sid,
        name: n,
        visits_required: v,
        is_active: true,
      });
      toast.success("Program je kreiran.");
      setName("");
      setVisits("10");
      setSvcId("");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Čuvanje nije uspelo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Loyalty (N + 1)"
        description="Za svaku uslugu može postojati jedan program: nakon N završenih termina klijent dobija jednu besplatnu posetu iste usluge. Označava se pri kreiranju termina „Iskoristi nagradu“; pri završetku termina skida se jedna nagrada ili se dodaje pečat ka sledećoj nagradi."
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Učitavanje…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid max-w-lg gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Novi program
              </p>
              <div className="space-y-2">
                <Label htmlFor="loy-svc">Usluga</Label>
                <select
                  id="loy-svc"
                  value={svcId}
                  onChange={(e) => setSvcId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Izaberi…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loy-name">Naziv programa</Label>
                <Input
                  id="loy-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="npr. 10+1 masaža"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loy-n">Završenih poseta do nagrade (N)</Label>
                <Input
                  id="loy-n"
                  inputMode="numeric"
                  value={visits}
                  onChange={(e) => setVisits(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void onAdd()}
              >
                Dodaj program
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Aktivni programi
              </p>
              {programs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nema programa — dodaj prvi za jednu uslugu.
                </p>
              ) : (
                <ul className="space-y-2">
                  {programs.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.service_name} · N = {p.visits_required}{" "}
                          {!p.is_active ? "· isključeno" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void (async () => {
                              try {
                                await patchLoyaltyProgram(p.id, {
                                  is_active: !p.is_active,
                                });
                                await load();
                              } catch (e) {
                                toast.error(
                                  getApiErrorMessage(e, "Izmena nije sačuvana.")
                                );
                              }
                            })();
                          }}
                        >
                          {p.is_active ? "Pauziraj" : "Uključi"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (
                              !confirm(
                                "Obrisati program? Stanja klijenata za njega će nestati."
                              )
                            ) {
                              return;
                            }
                            void (async () => {
                              try {
                                await deleteLoyaltyProgram(p.id);
                                toast.success("Program obrisan.");
                                await load();
                              } catch (e) {
                                toast.error(
                                  getApiErrorMessage(e, "Brisanje nije uspelo.")
                                );
                              }
                            })();
                          }}
                        >
                          Obriši
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
