"use client";

import { useMemo, useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { Printer, CheckSquare, Square } from "lucide-react";
import type { StockReport } from "@/actions/reports-actions";

const SIZE_PALETTE = [
  "#059669", "#0284c7", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1",
];

const STORAGE_KEY = "stock-report-order";

const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XGG", "XXG", "2G", "3G"];

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

interface Piece {
  name: string;
  type: string;
  total: number;
  novoCount: number;
  higienizadoCount: number;
  hasCritical: boolean;
  novoSizeData: { label: string; value: number; color: string; pct: number }[];
  higSizeData: { label: string; value: number; color: string; pct: number }[];
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

function PieceCard({
  piece,
  isDragging,
  isSelected,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  piece: Piece;
  isDragging: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDragStart: (e: React.DragEvent, name: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, name: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, piece.name)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, piece.name)}
      style={{
        border: piece.hasCritical ? "1px solid #fde68a" : isSelected ? "2px solid var(--navy-800)" : "1px solid var(--gray-200)",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? "scale(0.98)" : "none",
        transition: "opacity 0.15s, transform 0.15s, border 0.15s",
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
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          style={{
            flexShrink: 0,
            width: "20px",
            height: "20px",
            borderRadius: "5px",
            border: isSelected ? "2px solid var(--navy-800)" : "1.5px solid var(--gray-300)",
            backgroundColor: isSelected ? "var(--navy-800)" : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.1s",
          }}
          title={isSelected ? "Desselecionar para impressão" : "Selecionar para impressão"}
        >
          {isSelected && <CheckSquare size={13} style={{ color: "#fff" }} strokeWidth={3} />}
        </span>
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
            backgroundColor: piece.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe",
            color: piece.type === "EPI" ? "var(--navy-800)" : "#0284c7",
          }}
        >
          {piece.type === "EPI" ? "EPI" : "Uniforme"}
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
          {piece.novoSizeData.length === 0 ? (
            <span style={{ fontSize: "11px", color: "var(--gray-400)", padding: "20px 0" }}>Sem itens novos</span>
          ) : (
            <>
              <PieChart data={piece.novoSizeData} size={90} />
              <Legend items={piece.novoSizeData} />
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
          {piece.higSizeData.length === 0 ? (
            <span style={{ fontSize: "11px", color: "var(--gray-400)", padding: "20px 0" }}>Sem itens higienizados</span>
          ) : (
            <>
              <PieChart data={piece.higSizeData} size={90} />
              <Legend items={piece.higSizeData} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPieces(rows: StockReport["rows"]): Piece[] {
  const map = new Map<string, Piece>();

  for (const row of rows) {
    const key = row.name;
    if (!map.has(key)) {
      map.set(key, {
        name: row.name,
        type: row.type,
        total: 0,
        novoCount: 0,
        higienizadoCount: 0,
        hasCritical: false,
        novoSizeData: [],
        higSizeData: [],
      });
    }
    const piece = map.get(key)!;
    piece.total += row.stockQuantity;
    if (row.stockQuantity <= row.minStock) piece.hasCritical = true;

    if (row.condition === "NOVO") {
      piece.novoCount += row.stockQuantity;
    } else {
      piece.higienizadoCount += row.stockQuantity;
    }
  }

  const pieces = Array.from(map.values());

  for (const piece of pieces) {
    const novoBySize = new Map<string, number>();
    const higBySize = new Map<string, number>();

    for (const row of rows.filter((r) => r.name === piece.name)) {
      const sizeLabel = row.size || "Único";
      if (row.condition === "NOVO") {
        novoBySize.set(sizeLabel, (novoBySize.get(sizeLabel) || 0) + row.stockQuantity);
      } else {
        higBySize.set(sizeLabel, (higBySize.get(sizeLabel) || 0) + row.stockQuantity);
      }
    }

    piece.novoSizeData = (() => {
      const items = Array.from(novoBySize.entries())
        .map(([label, value], i) => ({ label, value, color: SIZE_PALETTE[i % SIZE_PALETTE.length] }))
        .sort(bySizeOrder);
      const total = items.reduce((s, d) => s + d.value, 0);
      return items.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }));
    })();

    piece.higSizeData = (() => {
      const items = Array.from(higBySize.entries())
        .map(([label, value], i) => ({ label, value, color: SIZE_PALETTE[i % SIZE_PALETTE.length] }))
        .sort(bySizeOrder);
      const total = items.reduce((s, d) => s + d.value, 0);
      return items.map((d) => ({ ...d, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 }));
    })();
  }

  pieces.sort((a, b) => {
    if (a.type !== b.type) return a.type === "EPI" ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return pieces;
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

export function StockReportCards({ report }: { report: StockReport }) {
  const storedOrder = useSyncExternalStore(subscribeToOrderChange, getStoredOrder, () => []);
  const [sessionPieces, setSessionPieces] = useState<Piece[] | null>(null);
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const [overName, setOverName] = useState<string | null>(null);
  const [prevReport, setPrevReport] = useState(report);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  if (prevReport !== report) {
    setPrevReport(report);
    setSessionPieces(null);
    setSelectedNames(new Set());
  }

  const allPieces = useMemo(() => buildPieces(report.rows), [report]);
  const orderedPieces = useMemo(() => deriveOrder(allPieces, storedOrder), [allPieces, storedOrder]);

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

  const toggleSelect = useCallback((name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const allSelected = displayPieces.length > 0 && displayPieces.every((p) => selectedNames.has(p.name));
  const noneSelected = selectedNames.size === 0;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(displayPieces.map((p) => p.name)));
    }
  }, [allSelected, displayPieces]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .stock-report-print, .stock-report-print * { visibility: visible !important; }
          .stock-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .stock-card-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
          .stock-card-grid > div { break-inside: avoid; }
          .stock-card-unselected { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={toggleSelectAll}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            border: "1px solid var(--gray-200)",
            backgroundColor: "#fff",
            color: "var(--navy-900)",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
          {allSelected ? "Limpar seleção" : "Selecionar todas"}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          disabled={noneSelected}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            border: "1px solid var(--gray-200)",
            backgroundColor: noneSelected ? "var(--gray-100)" : "#fff",
            color: noneSelected ? "var(--gray-400)" : "var(--navy-900)",
            cursor: noneSelected ? "not-allowed" : "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <Printer size={16} /> Imprimir{!noneSelected ? ` (${selectedNames.size})` : ""}
        </button>
      </div>

      <div className="stock-report-print">
        <div
          className="stock-card-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {displayPieces.map((piece) => {
            const isSelected = selectedNames.has(piece.name);
            return (
              <div
                key={piece.name}
                onDragEnter={() => handleDragEnter(piece.name)}
                className={noneSelected ? "" : isSelected ? "" : "stock-card-unselected"}
                style={{
                  outline: overName === piece.name && draggingName !== piece.name ? "2px dashed #0284c7" : "none",
                  outlineOffset: "2px",
                  borderRadius: "14px",
                  transition: "outline 0.15s",
                }}
              >
                <PieceCard
                  piece={piece}
                  isDragging={draggingName === piece.name}
                  isSelected={isSelected}
                  onToggleSelect={() => toggleSelect(piece.name)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
