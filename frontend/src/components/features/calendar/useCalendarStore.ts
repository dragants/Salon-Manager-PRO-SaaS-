import { useCallback, useState } from "react";
import type { AppointmentRow } from "@/types/appointment";

export function useCalendarStore(initial: AppointmentRow[]) {
  const [appointments, setAppointments] =
    useState<AppointmentRow[]>(initial);

  const moveAppointment = useCallback((id: number, newDate: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date: newDate } : a))
    );
  }, []);

  return {
    appointments,
    setAppointments,
    moveAppointment,
  };
}

export default useCalendarStore;
