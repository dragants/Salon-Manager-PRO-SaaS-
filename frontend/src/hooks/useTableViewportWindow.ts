import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
} from "react";

const DEFAULT_VH = 420;

export type TableViewportWindow = {
  enabled: boolean;
  from: number;
  to: number;
  topSpacer: number;
  bottomSpacer: number;
};

/**
 * Vertikalni „windowing“ za dugačke tabele: samo vidljivi redovi + spacer visine.
 */
export function useTableViewportWindow(
  scrollRef: RefObject<HTMLElement | null>,
  itemCount: number,
  rowHeightPx: number,
  opts?: {
    overscan?: number;
    minItems?: number;
    /** Uvek uključi ovaj indeks (npr. red u inline editu) da ostane u DOM-u. */
    pinIndex?: number | null;
  }
): TableViewportWindow {
  const overscan = opts?.overscan ?? 7;
  const minItems = opts?.minItems ?? 48;
  const pinIndex = opts?.pinIndex ?? null;
  const enabled = itemCount >= minItems;
  const [top, setTop] = useState(0);
  const [vh, setVh] = useState(DEFAULT_VH);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    setTop(el.scrollTop);
    setVh(el.clientHeight || DEFAULT_VH);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [scrollRef, measure, itemCount, pinIndex]);

  if (!enabled || itemCount === 0) {
    return {
      enabled: false,
      from: 0,
      to: itemCount,
      topSpacer: 0,
      bottomSpacer: 0,
    };
  }

  let from = Math.max(0, Math.floor(top / rowHeightPx) - overscan);
  let to = Math.min(
    itemCount,
    Math.ceil((top + vh) / rowHeightPx) + overscan
  );
  if (
    pinIndex != null &&
    pinIndex >= 0 &&
    pinIndex < itemCount
  ) {
    if (pinIndex < from) {
      from = Math.max(0, pinIndex - overscan);
    }
    if (pinIndex >= to) {
      to = Math.min(itemCount, pinIndex + overscan + 1);
    }
  }
  const topSpacer = from * rowHeightPx;
  const bottomSpacer = (itemCount - to) * rowHeightPx;

  return { enabled: true, from, to, topSpacer, bottomSpacer };
}
