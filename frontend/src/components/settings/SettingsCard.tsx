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
    <section className="rounded-xl border border-zinc-200/90 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
