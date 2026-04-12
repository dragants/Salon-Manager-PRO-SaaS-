import type { OrganizationSettings } from "@/types/organization";
import type { MeUser } from "@/types/user";

/** Administrator uvek sme; radnik samo ako je admin uključio u podešavanjima. */
export function canDeleteRecords(
  user: MeUser | null | undefined,
  settings: OrganizationSettings | null | undefined
): boolean {
  if (!user) {
    return false;
  }
  if (user.role === "admin") {
    return true;
  }
  if (user.role !== "worker") {
    return false;
  }
  return Boolean(settings?.worker_permissions?.can_delete);
}
