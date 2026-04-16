import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Za sticky thead + senka kad vertikalni scroll > 0.
 */
export function useTableHeadShadow(
  scrollRef: RefObject<HTMLElement | null>
): boolean {
  const [scrolled, setScrolled] = useState(false);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    setScrolled(Boolean(el && el.scrollTop > 1));
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, onScroll]);

  return scrolled;
}
