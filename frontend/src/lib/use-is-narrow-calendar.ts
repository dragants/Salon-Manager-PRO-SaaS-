"use client";

import { useEffect, useState } from "react";

/** Uski ekran: veći px/h u kalendaru i jači touch targeti (ispod `sm`). */
export function useIsNarrowCalendar(maxWidthPx = 639) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [maxWidthPx]);

  return narrow;
}
