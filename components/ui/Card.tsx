import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  engraved?: boolean;
}

export function Card({ className = "", engraved = false, children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-atlas-line bg-atlas-surface p-5 sm:p-6 text-atlas-ink shadow-xs transition-colors ${
        engraved ? "relative before:absolute before:inset-0 before:border before:border-atlas-line-subtle before:m-1 before:rounded-lg before:pointer-events-none" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-1.5 pb-4 border-b border-atlas-line-subtle ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display text-lg font-bold tracking-tight text-atlas-ink ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-atlas-muted leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
