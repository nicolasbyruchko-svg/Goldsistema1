"use client";

import { useMemo } from "react";

interface Variant {
  id: string;
  size: string | null;
  condition: string;
  type: string;
  stockQuantity: number;
  minStock: number;
}

interface Piece {
  name: string;
  variants: Variant[];
  total: number;
  novoCount: number;
  higienizadoCount: number;
  hasCritical: boolean;
}

const CONDITION_COLORS: Record<string, { fill: string; label: string }> = {
  NOVO: { fill: "#059669", label: "Novo" },
  HIGIENIZADO: { fill: "#0284c7", label: "Higienizado" },
};

const SIZE_PALETTE = [
  "#059669", "#0284c7", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1",
];

function PieSlice({ cx, cy, r, startAngle, endAngle, fill }: { cx: number; cy: number; r: number; startAngle: number; endAngle: number; fill: string }) {
  if (endAngle - startAngle >= 359.99) {
    return <circle cx={cx} cy={cy} r={r} fill={fill} />;
  }
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  return <path d={d} fill={fill} />;
}

function PieChart({ data, size = 80 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  let currentAngle = 0;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const slice = { ...d, startAngle: currentAngle, endAngle: currentAngle + angle };
    currentAngle += angle;
    return slice;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <PieSlice key={i} cx={cx} cy={cy} r={r} startAngle={s.startAngle} endAngle={s.endAngle} fill={s.color} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.45} fill="white" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.38} fontWeight={800} fill="var(--navy-900)">
        {total}
      </text>
    </svg>
  );
}

function Legend({ items }: { items: { label: string; value: number; color: string; pct: number }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: item.color, flexShrink: 0 }} />
          <span style={{ color: "var(--gray-600)", flex: 1 }}>{item.label}</span>
          <span style={{ fontWeight: 700, color: "var(--gray-800)" }}>{item.value}</span>
          <span style={{ color: "var(--gray-400)", fontSize: "10px" }}>({item.pct}%)</span>
        </div>
      ))}
    </div>
  );
}

function PieceCharts({ piece }: { piece: Piece }) {
  const conditionData = useMemo(() => {
    const items = [
      { label: "Novo", value: piece.novoCount, color: CONDITION_COLORS.NOVO.fill },
      { label: "Higienizado", value: piece.higienizadoCount, color: CONDITION_COLORS.HIGIENIZADO.fill },
    ].filter((d) => d.value > 0);
    const total = items.reduce((s, d) => s + d.value, 0);
    return items.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }));
  }, [piece]);

  const sizeData = useMemo(() => {
    const bySize = new Map<string, number>();
    for (const v of piece.variants) {
      const key = v.size || "Único";
      bySize.set(key, (bySize.get(key) || 0) + v.stockQuantity);
    }
    const items = Array.from(bySize.entries())
      .map(([label, value], i) => ({ label, value, color: SIZE_PALETTE[i % SIZE_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
    const total = items.reduce((s, d) => s + d.value, 0);
    return items.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }));
  }, [piece]);

  return (
    <div
      style={{
        border: piece.hasCritical ? "1px solid #fde68a" : "1px solid var(--gray-200)",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--gray-100)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: piece.hasCritical ? "#fffbeb" : "var(--gray-50)",
        }}
      >
        <span
          style={{
            flexShrink: 0,
            padding: "2px 8px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: piece.variants[0]?.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe",
            color: piece.variants[0]?.type === "EPI" ? "var(--navy-800)" : "#0284c7",
          }}
        >
          {piece.variants[0]?.type === "EPI" ? "EPI" : "Uniforme"}
        </span>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-900)", margin: 0, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {piece.name}
        </p>
        <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--navy-900)" }}>{piece.total}</span>
      </div>

      <div style={{ padding: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Condição
          </span>
          <PieChart data={conditionData} size={90} />
          <Legend items={conditionData} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tamanhos
          </span>
          <PieChart data={sizeData} size={90} />
          <Legend items={sizeData} />
        </div>
      </div>
    </div>
  );
}

export function StockCharts({ pieces }: { pieces: Piece[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "16px",
      }}
    >
      {pieces.map((piece) => (
        <PieceCharts key={piece.name} piece={piece} />
      ))}
    </div>
  );
}
