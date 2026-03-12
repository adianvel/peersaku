import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-semibold uppercase tracking-widest disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        cobalt:
          "bg-[var(--cobalt)] text-white hover:bg-[var(--cobalt-hover)]",
        outlined:
          "border border-[var(--border)] bg-transparent text-white hover:border-white/20",
        ghost:
          "bg-transparent text-[var(--steel)] hover:text-white",
        primary:
          "bg-[var(--cobalt)] text-white hover:bg-[var(--cobalt-hover)]",
        secondary:
          "border border-[var(--border)] bg-transparent text-white hover:border-white/20",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-6",
        full: "h-12 w-full px-6",
      },
    },
    defaultVariants: {
      variant: "cobalt",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
