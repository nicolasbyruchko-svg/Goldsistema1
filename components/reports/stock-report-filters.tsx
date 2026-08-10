"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, X, ChevronDown, Check } from "lucide-react";

interface StockReportFiltersProps {
  products: { id: string; name: string; size: string | null }[];
  currentFilters: {
    productIds: string[];
  };
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  placeholder,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabels = options.filter((o) => selected.includes(o.id));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          color: "var(--gray-400)",
          marginBottom: "4px",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "8px 32px 8px 10px",
          fontSize: "13px",
          fontFamily: "inherit",
          color: selected.length > 0 ? "var(--gray-900)" : "var(--gray-400)",
          backgroundColor: "#fff",
          border: "1.5px solid var(--gray-200)",
          borderRadius: "8px",
          outline: "none",
          cursor: "pointer",
          textAlign: "left",
          position: "relative",
          boxSizing: "border-box",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--navy-800)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(25,55,109,0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--gray-200)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {selected.length === 0
          ? placeholder
          : selected.length === 1
            ? selectedLabels[0]?.label
            : `${selected.length} selecionado(s)`}
        <ChevronDown
          size={14}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--gray-400)",
            pointerEvents: "none",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "#fff",
            border: "1px solid var(--gray-200)",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 50,
            maxHeight: "260px",
            overflowY: "auto",
            padding: "6px",
          }}
        >
          {options.length === 0 && (
            <div style={{ padding: "12px 10px", fontSize: "12px", color: "var(--gray-400)", textAlign: "center" }}>
              Nenhuma opção disponível
            </div>
          )}
          {options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: isSelected ? "rgba(25,55,109,0.06)" : "transparent",
                  color: "var(--gray-800)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "var(--gray-50)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    border: isSelected ? "2px solid var(--navy-800)" : "1.5px solid var(--gray-300)",
                    backgroundColor: isSelected ? "var(--navy-800)" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.1s",
                  }}
                >
                  {isSelected && <Check size={11} style={{ color: "#fff" }} strokeWidth={3} />}
                </div>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StockReportFilters({
  products,
  currentFilters,
}: StockReportFiltersProps) {
  const router = useRouter();
  const [productIds, setProductIds] = useState<string[]>(currentFilters.productIds);

  const toggleProduct = (id: string) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const apply = () => {
    const params = new URLSearchParams();
    productIds.forEach((id) => params.append("stockProductId", id));
    router.push(`/reports${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const clear = () => {
    setProductIds([]);
    router.push("/reports");
  };

  const hasFilter = productIds.length > 0;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "14px",
        border: "1px solid var(--gray-200)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        overflow: "visible",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--gray-200)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Filter size={16} style={{ color: "#059669" }} />
        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>
          Relatório de Estoque — Filtros
        </span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <MultiSelect
            label="Peça"
            options={products.map((p) => ({ id: p.id, label: p.name + (p.size ? ` (${p.size})` : "") }))}
            selected={productIds}
            onToggle={toggleProduct}
            placeholder="Todas as peças"
          />

          <div style={{ display: "flex", gap: "8px" }}>
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
                whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
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

        {hasFilter && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
            {productIds.map((id) => {
              const p = products.find((x) => x.id === id);
              return p ? (
                <span
                  key={id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: "#d1fae5",
                    color: "#059669",
                  }}
                >
                  {p.name}
                  <button
                    type="button"
                    onClick={() => toggleProduct(id)}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", color: "inherit" }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
