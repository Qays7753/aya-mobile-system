"use client";

import React from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, RefreshCcw, WifiOff, X } from "lucide-react";

type StatusBannerVariant = "info" | "success" | "warning" | "danger" | "offline";

type StatusBannerProps = {
  title?: string;
  message: string;
  variant?: StatusBannerVariant;
  actionLabel?: string;
  onAction?: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
};

function getVariantIcon(variant: StatusBannerVariant): ReactNode {
  switch (variant) {
    case "success":
      return <CheckCircle2 size={18} />;
    case "warning":
      return <AlertTriangle size={18} />;
    case "danger":
      return <AlertTriangle size={18} />;
    case "offline":
      return <WifiOff size={18} />;
    default:
      return <Info size={18} />;
  }
}

export function StatusBanner({
  title,
  message,
  variant = "info",
  actionLabel,
  onAction,
  dismissLabel = "إخفاء الرسالة",
  onDismiss
}: StatusBannerProps) {
  return (
    <div className={`status-banner status-banner--${variant}`} role="status" aria-live="polite">
      <div className="status-banner__icon">{getVariantIcon(variant)}</div>

      <div className="status-banner__copy">
        {title ? <strong>{title}</strong> : null}
        <p>{message}</p>
      </div>

      {actionLabel && onAction ? (
        <button type="button" className="secondary-button status-banner__action" onClick={onAction}>
          <RefreshCcw size={16} />
          {actionLabel}
        </button>
      ) : null}

      {onDismiss ? (
        <button
          type="button"
          className="icon-button status-banner__dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
