"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationDropdownItem = {
  id: string;
  title: string;
  body: string;
  at: Date | string | number;
  read: boolean;
  href?: string;
};

export type NotificationDropdownProps = {
  items: NotificationDropdownItem[];
  title?: string;
  emptyMessage?: string;
  onMarkAllRead?: () => void;
  onItemActivate?: (item: NotificationDropdownItem) => void;
  footer?: { href: string; label: string; onNavigate?: () => void };
  className?: string;
};

export function NotificationDropdownPanel({
  items,
  title = "Obaveštenja",
  emptyMessage = "Još nema obaveštenja.",
  onMarkAllRead,
  onItemActivate,
  footer,
  className,
}: NotificationDropdownProps) {
  const hasUnread = items.some((i) => !i.read);

  return (
    <div
      className={cn(
        "w-[min(calc(100vw-2rem),320px)] overflow-hidden rounded-[var(--smp-radius-lg)] border border-border bg-card shadow-[var(--smp-shadow-hover)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        {hasUnread && onMarkAllRead ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            onClick={onMarkAllRead}
          >
            <CheckCheck className="size-3.5" aria-hidden />
            Označi sve
          </button>
        ) : null}
      </div>
      <ul className="max-h-[min(70vh,320px)] overflow-y-auto">
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </li>
        ) : (
          items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "border-b border-border last:border-0",
                !n.read && "bg-primary/[0.06]"
              )}
            >
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 px-3 py-3 text-left text-sm transition hover:bg-muted/50"
                onClick={() => onItemActivate?.(n)}
              >
                <span className="font-medium text-foreground">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                <span className="text-[10px] text-muted-foreground/80">
                  {new Intl.DateTimeFormat("sr-Latn-RS", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(n.at))}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      {footer ? (
        <div className="border-t border-border px-3 py-2">
          <Link
            href={footer.href}
            className="text-xs font-medium text-primary hover:underline"
            onClick={footer.onNavigate}
          >
            {footer.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
