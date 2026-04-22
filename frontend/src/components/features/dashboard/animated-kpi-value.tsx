"use client";

import { useEffect, useRef, useState } from "react";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function useCountUp(
  target: number,
  durationMs: number,
  animateOnMount: boolean,
  reduced: boolean
): number {
  const [display, setDisplay] = useState(() =>
    reduced ? target : animateOnMount ? 0 : target
  );
  const fromRef = useRef(reduced ? target : animateOnMount ? 0 : target);

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    if (from === target) {
      setDisplay(target);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);

  return display;
}

type AnimatedIntegerProps = {
  value: number;
  className?: string;
  durationMs?: number;
  animateOnMount?: boolean;
};

export function AnimatedInteger({
  value,
  className,
  durationMs = 720,
  animateOnMount = true,
}: AnimatedIntegerProps) {
  const reduced = usePrefersReducedMotion();
  const display = useCountUp(value, durationMs, animateOnMount, reduced);
  return <span className={cn("tabular-nums", className)}>{display}</span>;
}

type AnimatedRsdProps = {
  value: number | null | undefined;
  className?: string;
  durationMs?: number;
};

export function AnimatedRsd({
  value,
  className,
  durationMs = 780,
}: AnimatedRsdProps) {
  const reduced = usePrefersReducedMotion();
  if (value == null || Number.isNaN(value)) {
    return <span className={cn("tabular-nums", className)}>—</span>;
  }
  const target = Math.round(value);
  const display = useCountUp(target, durationMs, true, reduced);
  return (
    <span className={cn("tabular-nums", className)}>{formatRsd(display)}</span>
  );
}
