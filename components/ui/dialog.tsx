"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "540px",
}: DialogProps) {
  // Trava scroll do body enquanto aberto
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(11, 36, 71, 0.55)",
          backdropFilter: "blur(4px)",
          animation: "dialogBackdropIn 0.18s ease-out",
        }}
      />

      {/* Dialog card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow:
            "0 24px 80px rgba(11, 36, 71, 0.25), 0 4px 16px rgba(0,0,0,0.08)",
          animation: "dialogContentIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--navy-900)",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--gray-500)",
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              color: "var(--gray-400)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--gray-100)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--gray-700)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--gray-400)";
            }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Divisor */}
        <div
          style={{
            height: "1px",
            backgroundColor: "var(--gray-200)",
            margin: "16px 0 0",
          }}
        />

        {/* Content */}
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}
