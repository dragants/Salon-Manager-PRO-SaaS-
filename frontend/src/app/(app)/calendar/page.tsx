"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { CalendarPageSkeleton } from "@/components/features/calendar/calendar-page-skeleton";

const SalonCalendar = dynamic(
  () =>
    import("@/components/features/calendar/salon-calendar").then((m) => ({
      default: m.SalonCalendar,
    })),
  {
    loading: () => <CalendarPageSkeleton />,
    ssr: false,
  }
);

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarPageSkeleton />}>
      <SalonCalendar />
    </Suspense>
  );
}
