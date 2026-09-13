import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "reward";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", type = "button", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-bg disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-5 py-2.5 text-base gap-2.5 font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-atlas-ink text-atlas-bg hover:opacity-90 shadow-sm border border-atlas-ink",
      secondary:
        "bg-atlas-surface text-atlas-ink border border-atlas-line hover:bg-atlas-surface-hover shadow-xs",
      outline:
        "border border-atlas-line text-atlas-ink hover:bg-atlas-surface bg-transparent",
      ghost:
        "text-atlas-muted hover:text-atlas-ink hover:bg-atlas-surface/80 bg-transparent",
      danger:
        "bg-atlas-danger text-white hover:opacity-90 border border-atlas-danger shadow-xs",
      // IMPORTANT: Gold is strictly reserved for rewards, milestones, and claims
      reward:
        "bg-atlas-reward text-slate-950 font-semibold border border-atlas-reward hover:opacity-95 shadow-[0_0_15px_var(--atlas-reward-subtle)]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
