"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function ReportSection({
  title,
  icon,
  iconBg,
  iconColor,
  summary,
  action,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  summary?: string;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        border: "1px solid var(--gray-200)",
        overflow: "hidden",
        marginTop: "16px",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--gray-50)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "9px",
            backgroundColor: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy-900)" }}>{title}</span>
          {summary && (
            <span style={{ display: "block", fontSize: "12px", color: "var(--gray-400)", marginTop: "1px" }}>{summary}</span>
          )}
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
        <ChevronDown
          size={18}
          style={{
            color: "var(--gray-400)",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div style={{ padding: "0 24px 24px 24px" }}>
          {children}
        </div>
      )}
    </div>
  );
}
