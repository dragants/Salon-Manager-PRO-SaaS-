import {
  Bell,
  Building2,
  Calendar,
  CalendarRange,
  Clock,
  CreditCard,
  Gift,
  Shield,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";
import { SpaIcon } from "@/components/icons/spa-icon";

export type SettingsTabId =
  | "salon"
  | "team"
  | "team_schedule"
  | "services"
  | "hours"
  | "calendar"
  | "notify"
  | "finance"
  | "loyalty"
  | "billing"
  | "security"
  | "flags";

export type SettingsTabConfig = {
  id: SettingsTabId;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

/** Za ulogu radnik — samo pregled tima (bez izmene podešavanja salona). */
export const WORKER_SETTINGS_TABS: SettingsTabConfig[] = [
  { id: "team", label: "Tim", icon: Users },
  { id: "team_schedule", label: "Raspored", icon: CalendarRange },
];

export const SETTINGS_TABS: SettingsTabConfig[] = [
  { id: "salon", label: "Salon", icon: Building2 },
  { id: "team", label: "Tim", icon: Users },
  { id: "team_schedule", label: "Raspored", icon: CalendarRange },
  { id: "services", label: "Usluge", icon: SpaIcon },
  { id: "hours", label: "Radno vreme", icon: Clock },
  { id: "calendar", label: "Kalendar", icon: Calendar },
  { id: "notify", label: "Notifikacije", icon: Bell },
  { id: "finance", label: "Finansije", icon: Wallet },
  { id: "loyalty", label: "Loyalty", icon: Gift },
  { id: "billing", label: "Pretplata", icon: CreditCard },
  { id: "security", label: "Sigurnost", icon: Shield },
  { id: "flags", label: "Feature flags", icon: SlidersHorizontal },
];
