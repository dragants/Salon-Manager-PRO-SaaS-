#!/bin/bash
# i18n wiring script for Salon Manager PRO
# Adds useT() to all components and replaces hardcoded Serbian strings
set -e
cd "$(dirname "$0")/.."

IMPORT_LINE='import { useT } from "@/lib/i18n/locale";'

# ── Step 1: Add import to all files that need it ──
FILES=(
  "frontend/src/app/(app)/account/page.tsx"
  "frontend/src/app/(app)/analytics/page.tsx"
  "frontend/src/app/(app)/clients/page.tsx"
  "frontend/src/app/(app)/dashboard/page.tsx"
  "frontend/src/app/(app)/finances/page.tsx"
  "frontend/src/app/(app)/onboarding/page.tsx"
  "frontend/src/app/(app)/services/page.tsx"
  "frontend/src/app/(app)/shifts/page.tsx"
  "frontend/src/app/(auth)/reset-password/page.tsx"
  "frontend/src/app/book/[slug]/page.tsx"
  "frontend/src/app/error.tsx"
  "frontend/src/app/not-found.tsx"
  "frontend/src/components/features/booking/StepClientForm.tsx"
  "frontend/src/components/features/booking/StepSelectDate.tsx"
  "frontend/src/components/features/booking/StepSelectSlot.tsx"
  "frontend/src/components/features/calendar/AddAppointmentModal.tsx"
  "frontend/src/components/features/calendar/AppointmentCard.tsx"
  "frontend/src/components/features/calendar/CalendarHeader.tsx"
  "frontend/src/components/features/calendar/DayColumn.tsx"
  "frontend/src/components/features/calendar/calendar-legend.tsx"
  "frontend/src/components/features/calendar/calendar-loading-skeleton.tsx"
  "frontend/src/components/features/calendar/salon-calendar.tsx"
  "frontend/src/components/features/clients/client-detail/client-detail-tab-basics.tsx"
  "frontend/src/components/features/clients/client-detail/client-detail-tab-chart.tsx"
  "frontend/src/components/features/clients/client-list-cards-saas.tsx"
  "frontend/src/components/features/clients/client-search.tsx"
  "frontend/src/components/features/dashboard/analytics-series-chart.tsx"
  "frontend/src/components/features/finances/expenses-table.tsx"
  "frontend/src/components/features/settings/AuditLogPanel.tsx"
  "frontend/src/components/features/settings/BillingTab.tsx"
  "frontend/src/components/features/settings/CalendarTab.tsx"
  "frontend/src/components/features/settings/FinanceTab.tsx"
  "frontend/src/components/features/settings/NotificationsTab.tsx"
  "frontend/src/components/features/settings/SalonTab.tsx"
  "frontend/src/components/features/settings/SecurityTab.tsx"
  "frontend/src/components/features/settings/ServicesTab.tsx"
  "frontend/src/components/features/settings/SettingsForm.tsx"
  "frontend/src/components/features/settings/TeamTab.tsx"
  "frontend/src/components/features/settings/WorkingHoursTab.tsx"
  "frontend/src/components/features/settings/team-schedule.tsx"
  "frontend/src/components/features/settings/working-hours-editor.tsx"
  "frontend/src/components/layout/auth-guard.tsx"
  "frontend/src/components/layout/command-palette.tsx"
  "frontend/src/components/layout/notification-bell.tsx"
)

for f in "${FILES[@]}"; do
  [ ! -f "$f" ] && continue
  if ! grep -q 'useT' "$f"; then
    sed -i "1a\\$IMPORT_LINE" "$f"
    echo "  import: $(basename $f)"
  fi
done

# ── Step 2: Add const t = useT(); inside component functions ──
for f in "${FILES[@]}"; do
  [ ! -f "$f" ] && continue
  grep -q 'const t = useT' "$f" && continue
  
  # Find first useState/useAuth/useOrganization/useRouter inside the component
  hook_line=$(grep -n 'useState\|useAuth\|useOrganization\|useRouter\|useParams\|useForm\|useSearchParams' "$f" | head -1 | cut -d: -f1)
  if [ -n "$hook_line" ]; then
    sed -i "${hook_line}a\\  const t = useT();" "$f"
    echo "  useT(): $(basename $f) at $hook_line"
  fi
done

# ── Step 3: Batch replace common strings ──
ALL_TSX=($(find frontend/src/app frontend/src/components -name '*.tsx' ! -path '*/landing/*' ! -path '*/i18n/*'))

for f in "${ALL_TSX[@]}"; do
  grep -q 'const t = useT' "$f" || continue
  
  # Common buttons
  sed -i 's/>Sačuvaj</>>{t.common.save}</g' "$f"
  sed -i 's/>Otkaži</>>{t.common.cancel}</g' "$f"
  sed -i 's/>Obriši</>>{t.common.delete}</g' "$f"
  sed -i 's/>Potvrdi</>>{t.common.confirm}</g' "$f"
  sed -i 's/>Izmeni</>>{t.common.edit}</g' "$f"
  sed -i 's/>Dodaj</>>{t.common.add}</g' "$f"
  sed -i 's/>Zatvori</>>{t.common.close}</g' "$f"
  sed -i 's/>Nazad</>>{t.common.back}</g' "$f"
  sed -i 's/>Dalje</>>{t.common.next}</g' "$f"
  sed -i 's/>Danas</>>{t.common.today}</g' "$f"
  sed -i 's/>Nedelja</>>{t.common.week}</g' "$f"
  sed -i 's/>Dan</>>{t.common.day}</g' "$f"
  
  # Loading states
  sed -i 's/"Učitavanje…"/t.common.loading/g' "$f"
  sed -i 's/"Učitavanje\.\.\."/t.common.loading/g' "$f"
  
  # Toasts
  sed -i 's/"Sačuvano\."/t.common.toasts.saved/g' "$f"
  sed -i 's/"Obrisano\."/t.common.toasts.deleted/g' "$f"
done

echo "=== Batch complete ==="
