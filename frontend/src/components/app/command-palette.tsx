"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Search,
  Sparkles,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getAuditLog, getClients, getServices } from "@/lib/api";
import {
  getRecentEntries,
  recordRecentCalendar,
  recordRecentClient,
} from "@/lib/cmd-palette-recent";
import { formatYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { AuditLogRow } from "@/types/audit";
import type { Client } from "@/types/client";
import type { Service } from "@/types/service";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CmdItem = {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  href?: string;
  onSelect?: () => void;
  keywords?: string;
};

type CmdSection = { id: string; title: string; items: CmdItem[] };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightMatch({
  text,
  needle,
  active,
}: {
  text: string;
  needle: string;
  active: boolean;
}) {
  const t = needle.trim();
  if (!t) {
    return <>{text}</>;
  }
  const re = new RegExp(`(${escapeRegExp(t)})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => {
        const isHit = part.toLowerCase() === t.toLowerCase();
        if (!isHit) {
          return <span key={i}>{part}</span>;
        }
        return (
          <strong
            key={i}
            className={cn(
              "font-bold",
              active
                ? "text-white dark:text-zinc-900"
                : "text-sky-700 dark:text-sky-300"
            )}
          >
            {part}
          </strong>
        );
      })}
    </>
  );
}

function formatAuditLine(row: AuditLogRow): string {
  const parts = [row.action];
  if (row.entity_type) {
    parts.push(String(row.entity_type));
  }
  return parts.join(" · ");
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [q, setQ] = useState("");
  const debouncedNeedle = useDebouncedValue(q.trim().toLowerCase(), 300);
  const [audit, setAudit] = useState<AuditLogRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openEpoch, setOpenEpoch] = useState(0);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => setOpenEpoch((e) => e + 1));
    }
  }, [open]);

  const todayYmd = formatYyyyMmDd(todayLocal());
  const weekCal = `/calendar?day=${encodeURIComponent(todayYmd)}&view=week`;

  const actionDefs = useMemo<CmdItem[]>(() => {
    const items: CmdItem[] = [
      {
        id: "add-client",
        label: "Dodaj klijenta",
        hint: "Formular za novog klijenta",
        icon: <UserPlus className="size-4" />,
        href: "/clients?new=1",
        keywords: "novi kupac",
      },
      {
        id: "new-booking",
        label: "Nova rezervacija",
        hint: "Kalendar (nedeljni prikaz)",
        icon: <CalendarDays className="size-4" />,
        href: weekCal,
        keywords: "termin zakazivanje booking",
      },
    ];
    if (isAdmin) {
      items.push({
        id: "new-service",
        label: "Nova usluga",
        hint: "Dodaj uslugu i cenu",
        icon: <Wrench className="size-4" />,
        href: "/services?new=1",
        keywords: "tretman cena trajanje",
      });
    }
    return items;
  }, [isAdmin, weekCal]);

  const navDefs = useMemo<CmdItem[]>(
    () => [
      {
        id: "nav-clients",
        label: "Idi na Klijente",
        icon: <Users className="size-4" />,
        href: "/clients",
        keywords: "lista klijenata",
      },
      {
        id: "nav-calendar",
        label: "Idi na Kalendar",
        icon: <CalendarDays className="size-4" />,
        href: weekCal,
        keywords: "raspored termini",
      },
      {
        id: "nav-finances",
        label: "Idi na Finansije",
        icon: <CreditCard className="size-4" />,
        href: "/finances",
        keywords: "prihod transakcije novac",
      },
      {
        id: "nav-dashboard",
        label: "Idi na Dashboard",
        icon: <LayoutDashboard className="size-4" />,
        href: "/dashboard",
        keywords: "početna pregled",
      },
    ],
    [weekCal]
  );

  useEffect(() => {
    if (!open || !isAdmin) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await getAuditLog({ limit: 8 });
        if (!cancelled && Array.isArray(data)) {
          setAudit(data);
        }
      } catch {
        if (!cancelled) {
          setAudit([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isAdmin]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [cRes, sRes] = await Promise.all([getClients(), getServices()]);
        if (!cancelled) {
          setClients(Array.isArray(cRes.data) ? cRes.data : []);
          setServices(Array.isArray(sRes.data) ? sRes.data : []);
        }
      } catch {
        if (!cancelled) {
          setClients([]);
          setServices([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleDialogOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setQ("");
      setSelectedIndex(0);
    }
  }

  const sections = useMemo((): CmdSection[] => {
    void openEpoch;
    const needle = debouncedNeedle;
    const match = (item: CmdItem) => {
      if (!needle) {
        return true;
      }
      const hay = `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase();
      return hay.includes(needle);
    };

    const clientById = new Map(clients.map((c) => [c.id, c]));

    const recentItems: CmdItem[] = [];
    if (!needle) {
      for (const e of getRecentEntries()) {
        if (e.kind === "client") {
          const c = clientById.get(e.id);
          if (c) {
            recentItems.push({
              id: `recent-c-${c.id}`,
              label: c.name,
              hint: c.phone ? `Telefon · ${c.phone}` : "Skorašnji klijent",
              icon: <Clock3 className="size-4" />,
              href: "/clients",
              keywords: `${c.phone ?? ""}`,
            });
          }
        } else {
          recentItems.push({
            id: `recent-cal-${e.href}`,
            label: e.label,
            hint: "Poslednji kalendar",
            icon: <CalendarDays className="size-4" />,
            href: e.href,
          });
        }
      }
    }

    const suggestedRaw = [
      actionDefs.find((a) => a.id === "new-booking"),
      actionDefs.find((a) => a.id === "add-client"),
    ].filter((x): x is CmdItem => Boolean(x));
    const suggestedItems: CmdItem[] = [];
    if (!needle) {
      const recentIds = new Set(recentItems.map((r) => r.href + r.label));
      for (const s of suggestedRaw) {
        const key = (s.href ?? "") + s.label;
        if (!recentIds.has(key)) {
          suggestedItems.push(s);
        }
      }
    }

    const actionItems = actionDefs.filter(match);
    const navItems = navDefs.filter(match);

    let clientItems: CmdItem[] = [];
    let serviceItems: CmdItem[] = [];
    if (needle.length >= 1) {
      clientItems = clients
        .filter((c) => {
          const hay = `${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase();
          return hay.includes(needle);
        })
        .slice(0, 8)
        .map((c) => ({
          id: `c-${c.id}`,
          label: c.name,
          hint: c.phone ? `Telefon · ${c.phone}` : "Klijent",
          icon: <Users className="size-4" />,
          href: "/clients",
          keywords: `${c.phone ?? ""} ${c.email ?? ""}`,
        }));

      serviceItems = services
        .filter((s) => {
          const hay = `${s.name} ${s.price}`.toLowerCase();
          return hay.includes(needle);
        })
        .slice(0, 8)
        .map((s) => ({
          id: `s-${s.id}`,
          label: s.name,
          hint: typeof s.price === "number" ? `${s.price} RSD` : String(s.price),
          icon: <Wrench className="size-4" />,
          href: "/services",
          keywords: String(s.price),
        }));
    }

    const out: CmdSection[] = [];
    if (!needle) {
      if (recentItems.length > 0) {
        out.push({ id: "recent", title: "Skorašnje", items: recentItems.slice(0, 5) });
      }
      if (suggestedItems.length > 0) {
        out.push({ id: "suggested", title: "Preporučeno", items: suggestedItems });
      }
    }
    if (actionItems.length > 0) {
      out.push({ id: "actions", title: "Akcije", items: actionItems });
    }
    if (navItems.length > 0) {
      out.push({ id: "nav", title: "Navigacija", items: navItems });
    }
    if (clientItems.length > 0) {
      out.push({ id: "clients", title: "Klijenti", items: clientItems });
    }
    if (serviceItems.length > 0) {
      out.push({ id: "services", title: "Usluge", items: serviceItems });
    }
    return out;
  }, [
    actionDefs,
    clients,
    debouncedNeedle,
    navDefs,
    openEpoch,
    services,
  ]);

  const flatList = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections]
  );

  useEffect(() => {
    queueMicrotask(() => setSelectedIndex(0));
  }, [debouncedNeedle, sections]);

  const activeIdx =
    flatList.length === 0
      ? 0
      : Math.min(Math.max(0, selectedIndex), flatList.length - 1);

  const runItem = useCallback(
    (item: CmdItem) => {
      if (item.href?.includes("/calendar")) {
        recordRecentCalendar(item.href, item.label);
      }
      if (item.id.startsWith("c-")) {
        const id = Number(item.id.slice(2));
        if (Number.isFinite(id)) {
          recordRecentClient(id, item.label);
        }
      }
      if (item.id.startsWith("recent-c-")) {
        const id = Number(item.id.replace("recent-c-", ""));
        if (Number.isFinite(id)) {
          recordRecentClient(id, item.label);
        }
      }

      setQ("");
      setSelectedIndex(0);
      onOpenChange(false);

      if (item.href) {
        router.push(item.href);
      }
      item.onSelect?.();
    },
    [onOpenChange, router]
  );

  function moveSelection(delta: number) {
    if (flatList.length === 0) {
      return;
    }
    setSelectedIndex((i) => {
      const len = flatList.length;
      const cur = Math.min(Math.max(0, i), len - 1);
      return (cur + delta + len) % len;
    });
  }

  function onPaletteKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
      return;
    }
    if (e.key === "Enter" && flatList.length > 0) {
      e.preventDefault();
      const item = flatList[activeIdx];
      if (item) {
        runItem(item);
      }
    }
  }

  const highlightNeedle = debouncedNeedle;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton
        overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-md"
        className="max-h-[min(85vh,560px)] gap-0 overflow-hidden border-zinc-200 p-0 shadow-lg sm:max-w-lg dark:border-zinc-800"
        onKeyDown={onPaletteKeyDown}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Brza pretraga i akcije</DialogTitle>
          <DialogDescription>
            Prečica: Ctrl+K ili Cmd+K. Grupe kao u Notionu; Enter potvrđuje.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-zinc-200/90 px-3 py-2 dark:border-zinc-800">
          <Search className="size-4 shrink-0 text-zinc-400" aria-hidden />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onPaletteKeyDown}
            placeholder="Akcije, navigacija, klijent, telefon, usluga…"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            autoComplete="off"
            autoFocus
          />
          <kbd className="hidden shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Esc
          </kbd>
        </div>

        <div
          className="max-h-[320px] overflow-y-auto p-2"
          role="listbox"
          aria-label="Rezultati komandne palete"
          aria-activedescendant={flatList[activeIdx]?.id}
        >
          {flatList.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-500">
              Nema rezultata.
            </p>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="mb-3 last:mb-0">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {section.title}
                </p>
                <ul className="space-y-0.5" role="group" aria-label={section.title}>
                  {section.items.map((item) => {
                    const flatIdx = flatList.indexOf(item);
                    const active = flatIdx === activeIdx;
                    return (
                      <li key={item.id} id={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ease-out",
                            active
                              ? "bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900"
                              : "hover:scale-[1.01] hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                          )}
                          onClick={() => runItem(item)}
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              active
                                ? "bg-white/15 text-white dark:bg-zinc-900/15 dark:text-zinc-900"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block font-medium",
                                active
                                  ? "text-white dark:text-zinc-900"
                                  : "text-zinc-900 dark:text-zinc-50"
                              )}
                            >
                              <HighlightMatch
                                text={item.label}
                                needle={highlightNeedle}
                                active={active}
                              />
                            </span>
                            {item.hint ? (
                              <span
                                className={cn(
                                  "block text-xs",
                                  active
                                    ? "text-white/80 dark:text-zinc-700"
                                    : "text-zinc-500 dark:text-zinc-400"
                                )}
                              >
                                <HighlightMatch
                                  text={item.hint}
                                  needle={highlightNeedle}
                                  active={active}
                                />
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {isAdmin && audit.length > 0 ? (
          <div className="border-t border-zinc-200/90 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              <Sparkles className="size-3" aria-hidden />
              Aktivnost (audit)
            </p>
            <ul className="max-h-[120px] space-y-1 overflow-y-auto text-xs text-zinc-600 dark:text-zinc-400">
              {audit.map((row) => (
                <li key={row.id} className="truncate">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {formatAuditLine(row)}
                  </span>
                  {row.actor_email ? (
                    <span className="text-zinc-400"> · {row.actor_email}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="border-t border-zinc-200/90 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/40 px-3 py-2 dark:border-zinc-800 dark:from-amber-950/20 dark:via-zinc-950 dark:to-amber-950/20">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Savet:
            </span>{" "}
            Proveri{" "}
            <Link
              href={weekCal}
              className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
              onClick={() => handleDialogOpenChange(false)}
            >
              kalendar
            </Link>{" "}
            za slobodne slotove narednih dana.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
