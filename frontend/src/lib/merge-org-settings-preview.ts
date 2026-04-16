import type { PatchOrgSettingsBody } from "@/lib/api";
import type { OrganizationSettings } from "@/types/organization";

function deepMergeSection<T extends Record<string, unknown>>(
  base: T | undefined,
  patch: Record<string, unknown>
): T {
  const b = base && typeof base === "object" ? { ...base } : ({} as T);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined) {
      continue;
    }
    const cur = (b as Record<string, unknown>)[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      cur &&
      typeof cur === "object" &&
      !Array.isArray(cur)
    ) {
      (b as Record<string, unknown>)[k] = deepMergeSection(
        cur as Record<string, unknown>,
        v as Record<string, unknown>
      );
    } else {
      (b as Record<string, unknown>)[k] = v;
    }
  }
  return b;
}

/**
 * Gruba optimistička projekcija getSettings odgovora posle PATCH tela (bez servera).
 */
export function mergeOrgSettingsPreview(
  base: OrganizationSettings,
  patch: PatchOrgSettingsBody
): OrganizationSettings {
  let next: OrganizationSettings = { ...base };

  if (patch.name !== undefined) {
    next = { ...next, name: patch.name };
  }
  if (patch.phone !== undefined) {
    next = { ...next, phone: patch.phone };
  }
  if (patch.address !== undefined) {
    next = { ...next, address: patch.address };
  }
  if (patch.logo !== undefined) {
    next = { ...next, logo: patch.logo };
  }
  if (patch.theme_color !== undefined) {
    next = { ...next, theme_color: patch.theme_color ?? "#3B82F6" };
  }
  if (patch.timezone !== undefined) {
    next = { ...next, timezone: patch.timezone };
  }
  if (patch.booking_slug !== undefined) {
    next = { ...next, booking_slug: patch.booking_slug };
  }
  if (patch.working_hours !== undefined) {
    next = {
      ...next,
      working_hours: (patch.working_hours ?? {}) as OrganizationSettings["working_hours"],
    };
  }

  if (patch.reminders !== undefined) {
    next = {
      ...next,
      reminders: deepMergeSection(
        next.reminders as Record<string, unknown>,
        patch.reminders as Record<string, unknown>
      ) as OrganizationSettings["reminders"],
    };
  }

  if (patch.settings !== undefined) {
    const s = patch.settings as Record<string, unknown>;
    for (const key of Object.keys(s)) {
      const v = s[key];
      if (v === undefined) continue;
      const cur = (next as Record<string, unknown>)[key];
      if (
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        cur &&
        typeof cur === "object"
      ) {
        (next as Record<string, unknown>)[key] = deepMergeSection(
          cur as Record<string, unknown>,
          v as Record<string, unknown>
        );
      } else {
        (next as Record<string, unknown>)[key] = v;
      }
    }
  }

  return next;
}
