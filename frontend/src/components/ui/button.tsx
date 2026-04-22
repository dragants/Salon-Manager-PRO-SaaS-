import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--smp-radius-md)] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none transition-all duration-200 ease-out focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45 enabled:hover:scale-[1.02] enabled:hover:brightness-110 enabled:active:scale-[0.98] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-primary text-primary-foreground !shadow-[var(--smp-shadow-primary)] hover:!brightness-100 hover:!bg-[rgb(var(--primary-hover))] hover:!shadow-[var(--smp-shadow-primary-hover)] dark:hover:!bg-primary/88 focus-visible:ring-primary/40",
        outline:
          "border-border bg-transparent text-foreground shadow-none hover:bg-white/[0.04] aria-expanded:bg-muted",
        secondary:
          "bg-secondary/80 text-secondary-foreground shadow-none hover:bg-secondary aria-expanded:bg-secondary",
        ghost:
          "text-muted-foreground shadow-none hover:bg-white/[0.04] hover:text-foreground aria-expanded:bg-muted/50",
        destructive:
          "bg-destructive/15 text-destructive shadow-none hover:bg-destructive/25 focus-visible:ring-destructive/30",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
        brand:
          "min-h-12 gap-2 rounded-[12px] px-[18px] py-3 text-[15px] font-semibold !shadow-[var(--smp-shadow-primary)] !brightness-100 bg-primary text-primary-foreground hover:!brightness-100 hover:!bg-[rgb(var(--primary-hover))] hover:!shadow-[var(--smp-shadow-primary-hover)] dark:hover:!bg-primary/88 focus-visible:ring-primary/40",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 rounded-[var(--smp-radius-sm)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[var(--smp-radius-sm)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
