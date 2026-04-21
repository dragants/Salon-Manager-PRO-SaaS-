"use client";

import { useState } from "react";
import {
  createTeamMember,
  deleteTeamMember,
  patchTeamMember,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrgTeamMember, WorkerProfile } from "@/types/user";
import type { Service } from "@/types/service";
import { SettingsCard } from "./SettingsCard";

function roleLabel(role: string) {
  if (role === "admin") return "Administrator";
  if (role === "worker") return "Radnik";
  return role;
}

function displayMemberName(m: OrgTeamMember) {
  const d = m.display_name?.trim();
  return d ? d : m.email;
}

function defaultProfile(m: OrgTeamMember): WorkerProfile {
  const p = m.worker_profile;
  if (p && typeof p === "object") {
    return {
      service_ids: Array.isArray(p.service_ids) ? p.service_ids : [],
      working_hours:
        p.working_hours && typeof p.working_hours === "object"
          ? (p.working_hours as Record<string, unknown>)
          : {},
    };
  }
  return { service_ids: [], working_hours: {} };
}

type TeamTabProps = {
  team: OrgTeamMember[];
  teamLoading: boolean;
  isAdmin: boolean;
  currentUserId?: number;
  services: Service[];
  onTeamChanged: () => void;
};

export function TeamTab({
  team,
  teamLoading,
  isAdmin,
  currentUserId,
  services,
  onTeamChanged,
}: TeamTabProps) {
  const [displayNameNew, setDisplayNameNew] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"worker" | "admin">("worker");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<OrgTeamMember | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<"worker" | "admin">("worker");
  const [editServiceIds, setEditServiceIds] = useState<number[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function openEdit(m: OrgTeamMember) {
    setEditing(m);
    setEditDisplayName(m.display_name?.trim() ?? "");
    setEditRole(m.role === "admin" ? "admin" : "worker");
    setEditServiceIds(defaultProfile(m).service_ids);
    setEditError(null);
  }

  function closeEdit() {
    setEditing(null);
    setEditError(null);
  }

  function toggleServiceId(id: number) {
    setEditServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onAddMember(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("Email i privremena lozinka su obavezni.");
      return;
    }
    if (password.length < 8) {
      setFormError("Lozinka min. 8 karaktera.");
      return;
    }
    setSaving(true);
    try {
      await createTeamMember({
        email: email.trim().toLowerCase(),
        password,
        role,
        display_name: displayNameNew.trim() || null,
      });
      setEmail("");
      setPassword("");
      setDisplayNameNew("");
      setRole("worker");
      onTeamChanged();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Član nije dodat."));
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    setEditSaving(true);
    try {
      await patchTeamMember(editing.id, {
        display_name: editDisplayName.trim() || null,
        role: editRole,
        worker_profile: {
          service_ids: editServiceIds,
          working_hours: defaultProfile(editing).working_hours,
        },
      });
      closeEdit();
      onTeamChanged();
    } catch (err) {
      setEditError(getApiErrorMessage(err, "Izmena nije sačuvana."));
    } finally {
      setEditSaving(false);
    }
  }

  async function onDelete(m: OrgTeamMember) {
    if (
      !window.confirm(
        `Ukloniti nalog ${m.email} iz salona? Ovo se ne može poništiti.`
      )
    ) {
      return;
    }
    setDeletingId(m.id);
    try {
      await deleteTeamMember(m.id);
      if (editing?.id === m.id) closeEdit();
      onTeamChanged();
    } catch (err) {
      window.alert(getApiErrorMessage(err, "Brisanje nije uspelo."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Uloge u timu"
        description={
          isAdmin
            ? "Administrator može menjati podešavanja salona i dodavati naloge. Radnik se prijavljuje istim URL-om — dobija pristup aplikaciji u okviru vašeg salona (ograničenja po stranicama dodajemo postepeno)."
            : "Samo administrator vidi formu za dodavanje. Ti si trenutno kao radnik — obrati se adminu salona."
        }
      >
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>Administrator</strong> — pun pristup (podešavanja, tim, svi
            moduli po pravilima sistema).
          </li>
          <li>
            <strong>Radnik</strong> — nalog za svakodnevni rad; idealno za
            terapeuta, maserku ili esteticara. Finansije i podešavanja mogu uskoro biti rezervisani
            samo za administratore.
          </li>
        </ul>
      </SettingsCard>

      {isAdmin ? (
        <SettingsCard
          title="Dodaj člana tima"
          description="Ime za prikaz (opciono), email i privremena lozinka. Osoba se prijavljuje na istoj prijavnoj strani."
        >
          <form onSubmit={onAddMember} className="space-y-4 max-w-md">
            {formError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="tm-name">Ime za prikaz (opciono)</Label>
              <Input
                id="tm-name"
                type="text"
                autoComplete="off"
                value={displayNameNew}
                onChange={(e) => setDisplayNameNew(e.target.value)}
                className="border-border"
                placeholder="npr. Ana"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tm-email">Email (za prijavu)</Label>
              <Input
                id="tm-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tm-pass">Privremena lozinka</Label>
              <Input
                id="tm-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tm-role">Uloga</Label>
              <select
                id="tm-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value === "admin" ? "admin" : "worker")
                }
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="worker">Radnik</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? "Čuvam…" : "Dodaj u tim"}
            </Button>
          </form>
        </SettingsCard>
      ) : null}

      <SettingsCard title="Članovi" description="Svi nalozi u tvom salonu.">
        {teamLoading ? (
          <p className="text-sm text-muted-foreground">Učitavanje tima…</p>
        ) : team.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema prikazanih članova.</p>
        ) : (
          <div className="divide-y divide-border/50 rounded-lg border border-border/90">
            {team.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {displayMemberName(m)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.email}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {roleLabel(m.role)}
                  </span>
                </div>
                {isAdmin ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={() => openEdit(m)}
                    >
                      Izmeni
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-800 hover:bg-red-50"
                      disabled={
                        deletingId === m.id || currentUserId === m.id
                      }
                      onClick={() => void onDelete(m)}
                    >
                      {deletingId === m.id ? "Brišem…" : "Ukloni"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      {isAdmin && editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Izmeni člana
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{editing.email}</p>
            <form onSubmit={(e) => void onSaveEdit(e)} className="mt-4 space-y-4">
              {editError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {editError}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="ed-name">Ime za prikaz</Label>
                <Input
                  id="ed-name"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-role">Uloga</Label>
                <select
                  id="ed-role"
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value === "admin" ? "admin" : "worker")
                  }
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
                >
                  <option value="worker">Radnik</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {services.length > 0 ? (
                <div className="space-y-2">
                  <Label>Usluge koje radi (opciono)</Label>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border/50 p-3">
                    {services.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={editServiceIds.includes(s.id)}
                          onChange={() => toggleServiceId(s.id)}
                          className="rounded border-border"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={editSaving}
                >
                  {editSaving ? "Čuvam…" : "Sačuvaj"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={closeEdit}
                >
                  Otkaži
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
