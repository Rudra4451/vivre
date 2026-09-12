import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-atlas-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full rounded-lg border bg-atlas-bg px-3.5 py-2 text-sm text-atlas-ink placeholder-atlas-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-ink/40 focus-visible:ring-offset-1 focus-visible:ring-offset-atlas-bg disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-atlas-danger focus-visible:ring-atlas-danger/50"
                : "border-atlas-line hover:border-atlas-muted/70 focus-visible:border-atlas-ink/80"
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[11px] font-medium text-atlas-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-atlas-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
