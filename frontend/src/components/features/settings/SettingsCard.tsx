import type { ReactNode } from "react";

type SettingsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsCard({
  title,
  description,
  children,
}: SettingsCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="mb-5">
        <h3 className="font-heading text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
