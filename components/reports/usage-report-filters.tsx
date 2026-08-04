"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface UsageReportFiltersProps {
  products: { id: string; name: string; size: string | null }[];
  sizes: string[];
  projects: { id: string; name: string }[];
  currentFilters: {
    productId?: string;
    size?: string;
    projectId?: string;
    from?: string;
    to?: string;
  };
}

export function UsageReportFilters({
  products,
  sizes,
  projects,
  currentFilters,
}: UsageReportFiltersProps) {
  const router = useRouter();
  const [productId, setProductId] = useState(currentFilters.productId ?? "");
  const [size, setSize] = useState(currentFilters.size ?? "");
  const [projectId, setProjectId] = useState(currentFilters.projectId ?? "");
  const [from, setFrom] = useState(currentFilters.from ?? "");
  const [to, setTo] = useState(currentFilters.to ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    if (productId) params.set("usageProductId", productId);
    if (size) params.set("usageSize", size);
    if (projectId) params.set("usageProjectId", projectId);
    if (from) params.set("usageFrom", from);
    if (to) params.set("usageTo", to);
    router.push(`/reports${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const clear = () => {
    setProductId("");
    setSize("");
    setProjectId("");
    setFrom("");
    setTo("");
    router.push("/reports");
  };

  const hasFilter = Boolean(productId || size || projectId || from || to);

  const inputStyle = { width: "100%", padding: "8px 10px", fontSize: "13px" };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    color: "var(--gray-400)",
    marginBottom: "4px",
    fontWeight: 500,
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "14px",
        border: "1px solid var(--gray-200)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        overflow: "hidden",
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
        <Filter size={16} style={{ color: "#d97706" }} />
        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>
          Relatório de Uso — Filtros
        </span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle}>Peça</label>
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todas as peças</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.size ? ` (${p.size})` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label style={labelStyle}>Tamanho</label>
            <Select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todos os tamanhos</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label style={labelStyle}>Contrato</label>
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todos os contratos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label style={labelStyle}>De</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Até</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={inputStyle}
            />
          </div>

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
      </div>
    </div>
  );
}
