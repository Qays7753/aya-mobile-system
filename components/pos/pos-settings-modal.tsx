"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  POS_DISPLAY_SIZE_MAX,
  POS_DISPLAY_SIZE_MIN,
  POS_DISPLAY_SIZE_STEP,
  type PosContrast
} from "@/stores/pos-settings";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

type PosSettingsModalProps = {
  open: boolean;
  displaySize: number;
  contrast: PosContrast;
  onClose: () => void;
  onChange: (next: {
    displaySize?: number;
    contrast?: PosContrast;
  }) => void;
  onReset: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const CONTRAST_OPTIONS: Array<{ value: PosContrast; label: string }> = [
  { value: "off", label: "افتراضي" },
  { value: "soft", label: "ناعم" },
  { value: "strong", label: "قوي" }
];

const DISPLAY_SIZE_PRESETS = [
  { id: "small", label: "صغير", value: 25 },
  { id: "normal", label: "طبيعي", value: 50 },
  { id: "large", label: "كبير", value: 75 }
] as const;

export function PosSettingsModal({
  open,
  displaySize,
  contrast,
  onClose,
  onChange,
  onReset,
  triggerRef
}: PosSettingsModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const triggerElement = triggerRef.current;
    const previousOverflow = document.body.style.overflow;

    function getFocusableElements() {
      return Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
      ).filter((element) => !element.hasAttribute("disabled"));
    }

    const frameHandle = window.requestAnimationFrame(() => {
      const [firstFocusableElement] = getFocusableElements();
      firstFocusableElement?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameHandle);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [onClose, open, triggerRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="pos-settings-modal" role="presentation">
      <button
        type="button"
        className="pos-settings-modal__backdrop"
        aria-label="إغلاق"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        className="pos-settings-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-settings-modal-title"
        aria-describedby="pos-settings-modal-scope"
        tabIndex={-1}
      >
        <header className="pos-settings-modal__header">
          <h2 id="pos-settings-modal-title" className="pos-settings-modal__title">
            الإعدادات
          </h2>
          <button
            type="button"
            className="icon-button pos-settings-modal__close"
            aria-label="إغلاق"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="pos-settings-modal__body">
          <p id="pos-settings-modal-scope" className="pos-settings-modal__scope">
            هذه الإعدادات تُحفظ على هذا الجهاز فقط
          </p>

          <section className="pos-settings-modal__fieldset" aria-label="حجم العرض">
            <div className="pos-settings-modal__slider-header">
              <h3 className="pos-settings-modal__legend">حجم العرض</h3>
              <output className="pos-settings-modal__readout" aria-live="polite">
                {displaySize}
              </output>
            </div>

            <input
              className="pos-settings-modal__slider"
              type="range"
              min={POS_DISPLAY_SIZE_MIN}
              max={POS_DISPLAY_SIZE_MAX}
              step={POS_DISPLAY_SIZE_STEP}
              value={displaySize}
              onChange={(event) => onChange({ displaySize: Number(event.target.value) })}
              aria-label="حجم العرض"
              aria-valuemin={POS_DISPLAY_SIZE_MIN}
              aria-valuemax={POS_DISPLAY_SIZE_MAX}
              aria-valuenow={displaySize}
            />

            <div className="pos-settings-modal__presets" aria-label="أحجام العرض">
              {DISPLAY_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="secondary-button pos-settings-modal__preset"
                  onClick={() => onChange({ displaySize: preset.value })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <hr className="pos-settings-modal__separator" />

          <fieldset className="pos-settings-modal__fieldset">
            <legend className="pos-settings-modal__legend">التباين</legend>
            <div className="pos-settings-modal__options">
              {CONTRAST_OPTIONS.map((option) => (
                <label key={option.value} className="pos-settings-modal__option">
                  <input
                    type="radio"
                    name="pos-contrast"
                    value={option.value}
                    checked={contrast === option.value}
                    onChange={() => onChange({ contrast: option.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="pos-settings-modal__footer">
          <button
            type="button"
            className="secondary-button pos-settings-modal__footer-button"
            onClick={onReset}
          >
            إعادة تعيين
          </button>
          <button
            type="button"
            className="secondary-button pos-settings-modal__footer-button"
            onClick={onClose}
          >
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
