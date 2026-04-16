import { forwardRef } from "react";
import type { SVGProps } from "react";

/** Znak za usluge: lepota, masaža, wellness (ne frizerski salon). */
export const SpaIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  function SpaIcon({ className, ...rest }, ref) {
    return (
      <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...rest}
    >
      <rect
        x="2.25"
        y="6.75"
        width="19.5"
        height="10.5"
        rx="3"
        className="fill-current opacity-[0.14]"
      />
      <text
        x="12"
        y="14.35"
        textAnchor="middle"
        className="fill-current text-[7.25px] font-semibold tracking-tight"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        Spa
      </text>
    </svg>
    );
  }
);
