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

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
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
      {/* Dimmed backdrop without excessive blur */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        ref={dialogRef}
        className={`relative z-10 w-full max-w-lg rounded-2xl border border-atlas-line bg-atlas-surface p-6 text-atlas-ink shadow-xl transition-all ${className}`}
      >
        <div className="flex items-start justify-between pb-4 border-b border-atlas-line-subtle">
          <div>
            {title && (
              <h3 id="modal-title" className="font-display text-lg font-bold text-atlas-ink">
                {title}
              </h3>
            )}
            {description && (
              <p id="modal-desc" className="mt-1 text-xs text-atlas-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-atlas-muted hover:bg-atlas-surface-elevated hover:text-atlas-ink transition-colors"
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
