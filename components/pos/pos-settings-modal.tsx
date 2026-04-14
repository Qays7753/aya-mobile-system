"use client";

import { usePosSettings } from "@/hooks/use-pos-settings";

interface PosSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PosSettingsModal({ isOpen, onClose }: PosSettingsModalProps) {
  const { settings, isHydrated } = usePosSettings();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: "rtl"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          width: "400px",
          maxWidth: "90%",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 1rem 0" }}>إعدادات نقطة البيع</h2>
        <p>هذه الواجهة قيد التطوير (المرحلة الرابعة).</p>

        <div style={{ margin: "1rem 0", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem 0" }}>الإعدادات الحالية:</h3>
          <pre style={{ margin: 0, fontSize: "0.8rem", overflowX: "auto" }}>
            {isHydrated ? JSON.stringify(settings, null, 2) : "Loading..."}
          </pre>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
