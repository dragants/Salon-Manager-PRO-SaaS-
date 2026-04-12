/** Jedna smena u planneru (klijentski model). */
export type ShiftPlannerShift = {
  id: string;
  employee_id: number;
  /** YYYY-MM-DD */
  date: string;
  /** Decimalni sat u odnosu na isti dan (npr. 9.5 = 09:30). */
  startHour: number;
  /** Trajanje u satima (npr. 2, 4.5). */
  durationHours: number;
};

/** Telo spremno za budući API (REST). */
export type ShiftPlannerApiRow = {
  employee_id: number;
  start: string;
  end: string;
  date: string;
};

/** Red iz GET /shifts. */
export type WorkShiftRow = {
  id: number;
  user_id: number;
  shift_date: string;
  start: string;
  end: string;
  display_name: string | null;
  email: string;
};

/** Slot iz GET /availability. */
export type AvailabilitySlotDto = {
  employee_id: number;
  employee_name: string;
  start: string;
  end: string;
  start_iso: string;
  soon: boolean;
};
