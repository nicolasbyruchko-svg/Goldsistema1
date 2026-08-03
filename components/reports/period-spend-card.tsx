"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PeriodSpendCardProps {
  value: string;
  itemsSub: string;
  from: string;
  to: string;
}

export function PeriodSpendCard({ value, itemsSub, from, to }: PeriodSpendCardProps) {
  const router = useRouter();
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);

  const apply = () => {
    const params = new URLSearchParams();
    if (start) params.set("from", start);
    if (end) params.set("to", end);
    router.push(`/reports${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const clear = () => {
    setStart("");
    setEnd("");
    router.push("/reports");
  };

  const hasFilter = Boolean(from || to);

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px 24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        border: "1px solid var(--gray-200)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarRange size={16} style={{ color: "#0284c7" }} />
          </div>
          <span style={{ fontSize: "13px", color: "var(--gray-500)", fontWeight: 500 }}>
            Gasto no período
          </span>
        </div>

        {/* Período de X a Y */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexWrap: "wrap" }}>
          <div>
            <label
              htmlFor="period-from"
              style={{ display: "block", fontSize: "11px", color: "var(--gray-400)", marginBottom: "4px", fontWeight: 500 }}
            >
              De
            </label>
            <Input
              id="period-from"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{ width: "150px", padding: "8px 10px", fontSize: "13px" }}
            />
          </div>
          <div>
            <label
              htmlFor="period-to"
              style={{ display: "block", fontSize: "11px", color: "var(--gray-400)", marginBottom: "4px", fontWeight: 500 }}
            >
              Até
            </label>
            <Input
              id="period-to"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{ width: "150px", padding: "8px 10px", fontSize: "13px" }}
            />
          </div>
          <button
            type="button"
            onClick={apply}
            style={{
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "inherit",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--navy-800)",
              color: "#fff",
              cursor: "pointer",
              transition: "opacity 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Aplicar
          </button>
          {hasFilter && (
            <button
              type="button"
              onClick={clear}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "inherit",
                borderRadius: "8px",
                border: "1px solid var(--gray-200)",
                backgroundColor: "#fff",
                color: "var(--gray-600)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <X size={13} />
              Limpar
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: "16px", display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "30px", fontWeight: 800, color: "#0284c7", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "2px" }}>{itemsSub}</span>
      </div>
    </div>
  );
}
