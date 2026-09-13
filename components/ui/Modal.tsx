"use client";

import * as React from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    // 1. Remember previously focused element to return focus on modal close
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // 2. Lock background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 3. Move initial focus into modal
    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length > 0) {
          focusableElements[0]?.focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 20);

    // 4. Keyboard handlers: Escape to close, Tab to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      // Return focus to triggering element
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-desc" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container with visible focus & tabindex for initial focus */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-lg rounded-2xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-6 text-[var(--atlas-ink)] shadow-xl transition-all focus:outline-none ${className}`}
      >
        <div className="flex items-start justify-between pb-4 border-b border-[var(--atlas-line-subtle)]">
          <div>
            {title && (
              <h3 id="modal-title" className="font-display text-lg font-bold text-[var(--atlas-ink)]">
                {title}
              </h3>
            )}
            {description && (
              <p id="modal-desc" className="mt-1 text-xs text-[var(--atlas-muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--atlas-muted)] hover:bg-[var(--atlas-surface-elevated)] hover:text-[var(--atlas-ink)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--atlas-ink)] focus-visible:outline-none"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
