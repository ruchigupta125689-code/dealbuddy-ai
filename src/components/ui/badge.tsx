import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground-muted",
        accent: "bg-accent-soft text-accent",
        green: "bg-success-soft text-success",
        yellow: "bg-warning-soft text-warning",
        red: "bg-danger-soft text-danger",
        outline: "border border-border text-foreground-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
