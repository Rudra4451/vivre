import * as React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-atlas-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full appearance-none rounded-lg border bg-atlas-bg px-3.5 py-2 pr-9 text-sm text-atlas-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-ink/40 focus-visible:ring-offset-1 focus-visible:ring-offset-atlas-bg disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-atlas-danger focus-visible:ring-atlas-danger/50"
                : "border-atlas-line hover:border-atlas-muted/70 focus-visible:border-atlas-ink/80"
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-atlas-surface text-atlas-ink">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-atlas-muted text-xs">
            ▼
          </div>
        </div>
        {error && (
          <p className="text-[11px] font-medium text-atlas-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
