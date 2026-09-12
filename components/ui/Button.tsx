"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
      primary: "bg-sky-500 text-white hover:bg-sky-400 shadow-md shadow-sky-500/20 active:scale-[0.98]",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-[0.98]",
      outline: "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/60 active:scale-[0.98]",
      ghost: "text-slate-300 hover:bg-slate-800/50 active:scale-[0.98]",
      danger: "bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
