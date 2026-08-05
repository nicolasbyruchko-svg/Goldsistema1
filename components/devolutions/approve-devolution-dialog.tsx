"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, PackageCheck, PackageX, Info } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { approveDevolution } from "@/actions/devolution-actions";

const CONDITION_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  GOOD: { label: "Bom estado", bg: "#dcfce7", color: "#15803d" },
  DAMAGED: { label: "Rasgado / Deteriorado", bg: "#fef3c7", color: "#92400e" },
  UNUSABLE: { label: "Não utilizável", bg: "#fee2e2", color: "#dc2626" },
};

interface DevolutionItem {
  id: string;
  quantity: number;
  condition: string;
  product: { name: string };
}

interface Devolution {
  id: string;
  worker: { name: string; matricula: string };
  items: DevolutionItem[];
}

interface ApproveDevolutionDialogProps {
  devolution: Devolution;
  open: boolean;
  onClose: () => void;
}

export function ApproveDevolutionDialog({ devolution, open, onClose }: ApproveDevolutionDialogProps) {
  const router = useRouter();
  const [approvals, setApprovals] = useState<Record<string, number>>(() =>
    Object.fromEntries(devolution.items.map((item) => [item.id, item.quantity]))
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setApprovedQty = (itemId: string, qty: number) => {
    const item = devolution.items.find((i) => i.id === itemId);
    if (!item) return;
    const clamped = Math.min(Math.max(Math.round(qty) || 0, 0), item.quantity);
    setApprovals((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const handleApproveAll = () => {
    const newVals: Record<string, number> = {};
    for (const item of devolution.items) {
      newVals[item.id] = item.quantity;
    }
    setApprovals(newVals);
  };

  const handleRejectAll = () => {
    const newVals: Record<string, number> = {};
    for (const item of devolution.items) {
      newVals[item.id] = 0;
    }
    setApprovals(newVals);
  };

  const summary = useMemo(() => {
    let stockQty = 0;
    let discardQty = 0;
    for (const item of devolution.items) {
      const approvedQty = approvals[item.id] ?? 0;
      const reprovedQty = item.quantity - approvedQty;
      if (item.condition === "GOOD") {
        stockQty += approvedQty;
      }
      discardQty += reprovedQty;
      if (item.condition !== "GOOD") {
        discardQty += approvedQty;
      }
    }
    return { stockQty, discardQty };
  }, [devolution.items, approvals]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setServerError(null);

    const itemApprovals = devolution.items.map((item) => ({
      itemId: item.id,
      approvedQty: approvals[item.id] ?? 0,
    }));

    const result = await approveDevolution(devolution.id, itemApprovals);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setServerError(result.error);
    }
    setIsSubmitting(false);
  };

  const allApproved = devolution.items.every((item) => (approvals[item.id] ?? 0) === item.quantity);
  const allRejected = devolution.items.every((item) => (approvals[item.id] ?? 0) === 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Aprovar Devolução"
      description={`Triagem dos itens devolvidos por ${devolution.worker.name}. Selecione quantas peças de cada item são aprovadas e quantas reprovadas.`}
      maxWidth="720px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Quick actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleApproveAll}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "inherit",
              borderRadius: "6px",
              border: "1px solid #bbf7d0",
              backgroundColor: "#f0fdf4",
              color: "#15803d",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#dcfce7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f0fdf4"; }}
          >
            <CheckCircle2 size={13} />
            Aprovar todos
          </button>
          <button
            type="button"
            onClick={handleRejectAll}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "inherit",
              borderRadius: "6px",
              border: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; }}
          >
            <XCircle size={13} />
            Reprovar todos
          </button>
        </div>

        {/* Items list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {devolution.items.map((item) => {
            const approvedQty = approvals[item.id] ?? 0;
            const reprovedQty = item.quantity - approvedQty;
            const style = CONDITION_CONFIG[item.condition] ?? { label: item.condition, bg: "#f3f4f6", color: "#6b7280" };
            const fullyApproved = approvedQty === item.quantity;
            const fullyRejected = approvedQty === 0;

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "12px 14px",
                  backgroundColor: "#fafafa",
                  borderRadius: "10px",
                  border: "1px solid var(--gray-200)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--gray-900)" }}>
                      {item.quantity}x {item.product.name}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: "8px",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: style.bg,
                        color: style.color,
                      }}
                    >
                      {style.label}
                    </span>
                  </div>
                  {fullyRejected && (
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626", display: "flex", alignItems: "center", gap: "4px" }}>
                      <XCircle size={13} />
                      Tudo reprovado
                    </span>
                  )}
                  {fullyApproved && item.condition === "GOOD" && (
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={13} />
                      Tudo aprovado
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Aprovar qty */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "8px",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <PackageCheck size={16} style={{ color: "#15803d", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d", whiteSpace: "nowrap" }}>Aprovar</span>
                    <input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={approvedQty}
                      onChange={(e) => setApprovedQty(item.id, Number(e.target.value))}
                      style={{
                        width: "60px",
                        padding: "5px 8px",
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "inherit",
                        textAlign: "center",
                        borderRadius: "6px",
                        border: "1px solid #86efac",
                        backgroundColor: "#fff",
                        color: "#15803d",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Reprovar qty */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <PackageX size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#dc2626", whiteSpace: "nowrap" }}>Reprovar</span>
                    <span
                      style={{
                        width: "60px",
                        padding: "5px 8px",
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "inherit",
                        textAlign: "center",
                        borderRadius: "6px",
                        border: "1px solid #fecaca",
                        backgroundColor: "#fff",
                        color: "#dc2626",
                      }}
                    >
                      {reprovedQty}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            padding: "14px",
            backgroundColor: "var(--gray-50)",
            borderRadius: "10px",
            border: "1px solid var(--gray-200)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PackageCheck size={16} style={{ color: "#15803d" }} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "11px", color: "var(--gray-500)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Voltam ao estoque
              </span>
              <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#15803d" }}>
                {summary.stockQty}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PackageX size={16} style={{ color: "#dc2626" }} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "11px", color: "var(--gray-500)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Descartados
              </span>
              <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#dc2626" }}>
                {summary.discardQty}
              </span>
            </div>
          </div>
        </div>

        {/* Warning for approved non-GOOD items */}
        {devolution.items.some((i) => (approvals[i.id] ?? 0) > 0 && i.condition !== "GOOD") && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 14px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#92400e",
            }}
          >
            <AlertTriangle size={14} style={{ marginTop: "1px", flexShrink: 0 }} />
            <span>
              Itens aprovados que estão <strong>rasgados ou não utilizáveis</strong> NÃO voltam ao estoque — serão descartados.
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label
            htmlFor="approve-notes"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--gray-700)",
              marginBottom: "6px",
            }}
          >
            <Info size={13} />
            Observações da triagem (opcional)
          </label>
          <textarea
            id="approve-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: 2 peças apresentavam defeito no zíper, 3 estavam limpas..."
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "13px",
              fontFamily: "inherit",
              borderRadius: "8px",
              border: "1px solid var(--gray-200)",
              backgroundColor: "#fff",
              color: "var(--gray-800)",
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--navy-600)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--gray-200)"; }}
          />
        </div>

        {/* Server error */}
        {serverError && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#dc2626",
            }}
            role="alert"
          >
            {serverError}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            paddingTop: "8px",
            borderTop: "1px solid var(--gray-100)",
          }}
        >
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "inherit",
              borderRadius: "8px",
              border: "none",
              backgroundColor: allRejected ? "#dc2626" : "#059669",
              color: "#fff",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {isSubmitting && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            )}
            {allRejected ? "Confirmar reprovação" : "Confirmar aprovação"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}