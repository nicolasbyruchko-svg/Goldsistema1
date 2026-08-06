"use client";

import { useMemo, useState, useCallback, useEffect, useSyncExternalStore } from "react";

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

const SIZE_PALETTE = [
  "#059669", "#0284c7", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1",
];

const STORAGE_KEY = "stock-charts-order";

const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XGG", "XXG", "2G", "3G"];

// Ordena tamanhos em ordem progressiva (numérico antes de alfanumérico, depois
// pela sequência PP/P/M/G/GG), com "Único" por último.
function sizeSortKey(label: string): [number, number] {
  if (label === "Único") return [2, 0];
  const n = Number(label.replace(",", "."));
  if (!Number.isNaN(n) && /^[\d.,]+$/.test(label)) return [0, n];
  const idx = SIZE_ORDER.indexOf(label.toUpperCase());
  if (idx !== -1) return [1, idx];
  return [1, 100 + label.length];
}

function bySizeOrder(a: { label: string }, b: { label: string }): number {
  const ka = sizeSortKey(a.label);
  const kb = sizeSortKey(b.label);
  return ka[0] - kb[0] || ka[1] - kb[1];
}

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

  const slices = data.reduce<{ label: string; value: number; color: string; startAngle: number; endAngle: number }[]>(
    (acc, d) => {
      const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
      const angle = (d.value / total) * 360;
      acc.push({ ...d, startAngle, endAngle: startAngle + angle });
      return acc;
    },
    []
  );

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

function PieceCharts({
  piece,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  piece: Piece;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, name: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, name: string) => void;
}) {
  const novoSizeData = useMemo(() => {
    const bySize = new Map<string, number>();
    for (const v of piece.variants.filter((v) => v.condition === "NOVO")) {
      const key = v.size || "Único";
      bySize.set(key, (bySize.get(key) || 0) + v.stockQuantity);
    }
    const items = Array.from(bySize.entries())
      .map(([label, value], i) => ({ label, value, color: SIZE_PALETTE[i % SIZE_PALETTE.length] }))
      .sort(bySizeOrder);
    const total = items.reduce((s, d) => s + d.value, 0);
    return items.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }));
  }, [piece]);

  const higSizeData = useMemo(() => {
    const bySize = new Map<string, number>();
    for (const v of piece.variants.filter((v) => v.condition === "HIGIENIZADO")) {
      const key = v.size || "Único";
      bySize.set(key, (bySize.get(key) || 0) + v.stockQuantity);
    }
    const items = Array.from(bySize.entries())
      .map(([label, value], i) => ({ label, value, color: SIZE_PALETTE[i % SIZE_PALETTE.length] }))
      .sort(bySizeOrder);
    const total = items.reduce((s, d) => s + d.value, 0);
    return items.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }));
  }, [piece]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, piece.name)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, piece.name)}
      style={{
        border: piece.hasCritical ? "1px solid #fde68a" : "1px solid var(--gray-200)",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? "scale(0.98)" : "none",
        transition: "opacity 0.15s, transform 0.15s",
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
          userSelect: "none",
        }}
      >
        <span
          style={{
            flexShrink: 0,
            fontSize: "14px",
            color: "var(--gray-300)",
            cursor: "grab",
          }}
          title="Arrastar para reordenar"
        >
          ⠿
        </span>
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#059669" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Novos ({piece.novoCount})
            </span>
          </div>
          {novoSizeData.length === 0 ? (
            <span style={{ fontSize: "11px", color: "var(--gray-400)", padding: "20px 0" }}>Sem itens novos</span>
          ) : (
            <>
              <PieChart data={novoSizeData} size={90} />
              <Legend items={novoSizeData} />
            </>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#0284c7" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Higienizados ({piece.higienizadoCount})
            </span>
          </div>
          {higSizeData.length === 0 ? (
            <span style={{ fontSize: "11px", color: "var(--gray-400)", padding: "20px 0" }}>Sem itens higienizados</span>
          ) : (
            <>
              <PieChart data={higSizeData} size={90} />
              <Legend items={higSizeData} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function subscribeToOrderChange() {
  return () => {};
}

let cachedStoredOrder: string[] | null = null;
function getStoredOrder(): string[] {
  if (cachedStoredOrder !== null) return cachedStoredOrder;
  let order: string[] = [];
  if (typeof window !== "undefined") {
    try {
      order = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") ?? [];
    } catch {
      order = [];
    }
  }
  cachedStoredOrder = order;
  return order;
}

function deriveOrder(pieces: Piece[], storedOrder: string[]): Piece[] {
  const byName = new Map(pieces.map((p) => [p.name, p]));
  const restored = storedOrder.map((name) => byName.get(name)).filter((p): p is Piece => !!p);
  const newPieces = pieces.filter((p) => !storedOrder.includes(p.name));
  return [...restored, ...newPieces];
}

export function StockCharts({ pieces }: { pieces: Piece[] }) {
  const storedOrder = useSyncExternalStore(subscribeToOrderChange, getStoredOrder, () => []);
  const [sessionPieces, setSessionPieces] = useState<Piece[] | null>(null);
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const [overName, setOverName] = useState<string | null>(null);
  const [prevPieces, setPrevPieces] = useState(pieces);

  if (prevPieces !== pieces) {
    setPrevPieces(pieces);
    setSessionPieces(null);
  }

  const orderedPieces = useMemo(() => deriveOrder(pieces, storedOrder), [pieces, storedOrder]);

  useEffect(() => {
    if (sessionPieces && sessionPieces.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionPieces.map((p) => p.name)));
    }
  }, [sessionPieces]);

  const handleDragStart = useCallback((e: React.DragEvent, name: string) => {
    setDraggingName(name);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", name);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnter = useCallback((name: string) => {
    setOverName(name);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingName(null);
    setOverName(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetName: string) => {
    e.preventDefault();
    const sourceName = e.dataTransfer.getData("text/plain");
    if (!sourceName || sourceName === targetName) {
      setDraggingName(null);
      setOverName(null);
      return;
    }

    setSessionPieces((prev) => {
      const base = prev ?? orderedPieces;
      const items = [...base];
      const srcIdx = items.findIndex((p) => p.name === sourceName);
      const tgtIdx = items.findIndex((p) => p.name === targetName);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const [moved] = items.splice(srcIdx, 1);
      items.splice(tgtIdx, 0, moved);
      return items;
    });

    setDraggingName(null);
    setOverName(null);
  }, [orderedPieces]);

  const displayPieces = sessionPieces ?? orderedPieces;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "16px",
      }}
    >
      {displayPieces.map((piece) => (
        <div
          key={piece.name}
          onDragEnter={() => handleDragEnter(piece.name)}
          style={{
            outline: overName === piece.name && draggingName !== piece.name ? "2px dashed #0284c7" : "none",
            outlineOffset: "2px",
            borderRadius: "14px",
            transition: "outline 0.15s",
          }}
        >
          <PieceCharts
            piece={piece}
            isDragging={draggingName === piece.name}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        </div>
      ))}
    </div>
  );
}
