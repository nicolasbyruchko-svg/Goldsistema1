"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sofa, PackageCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { repairEntry } from "@/actions/devolution-actions";

interface RepairItem {
  id: string;
  quantity: number;
  repairedQty: number;
  product: { name: string };
}

interface RepairEntryDialogProps {
  items: RepairItem[];
  open: boolean;
  onClose: () => void;
}

export function RepairEntryDialog({ items, open, onClose }: RepairEntryDialogProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const item of items) {
      initial[item.id] = item.quantity - item.repairedQty;
    }
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setQty = (itemId: string, qty: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const max = item.quantity - item.repairedQty;
    const clamped = Math.min(Math.max(Math.round(qty) || 0, 0), max);
    setQuantities((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setServerError(null);

    for (const item of items) {
      const qty = quantities[item.id] ?? 0;
      if (qty <= 0) continue;
      const result = await repairEntry(item.id, qty);
      if (!result.success) {
        setServerError(result.error ?? "Erro ao dar entrada");
        setIsSubmitting(false);
        return;
      }
    }

    router.refresh();
    onClose();
    setIsSubmitting(false);
  };

  const totalToStock = items.reduce((s, item) => s + (quantities[item.id] ?? 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Dar entrada após reparo"
      description="Informe quantas peças reparadas entram de volta no estoque."
      maxWidth="560px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item) => {
            const remaining = item.quantity - item.repairedQty;
            const qty = quantities[item.id] ?? 0;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  backgroundColor: "#eef2ff",
                  borderRadius: "10px",
                  border: "1px solid #c7d2fe",
                }}
              >
                <Sofa size={16} style={{ color: "#4338ca", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--gray-900)" }}>
                    {item.product.name}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--gray-500)" }}>
                    {item.repairedQty}/{item.quantity} já retornaram · {remaining} em reparo
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#4338ca" }}>Entrar:</span>
                  <input
                    type="number"
                    min={0}
                    max={remaining}
                    value={qty}
                    onChange={(e) => setQty(item.id, Number(e.target.value))}
                    style={{
                      width: "60px",
                      padding: "5px 8px",
                      fontSize: "14px",
                      fontWeight: 700,
                      fontFamily: "inherit",
                      textAlign: "center",
                      borderRadius: "6px",
                      border: "1px solid #c7d2fe",
                      backgroundColor: "#fff",
                      color: "#4338ca",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            backgroundColor: "#f0fdf4",
            borderRadius: "10px",
            border: "1px solid #bbf7d0",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d", display: "flex", alignItems: "center", gap: "6px" }}>
            <PackageCheck size={16} />
            Voltarão ao estoque
          </span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#15803d" }}>{totalToStock}</span>
        </div>

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
            disabled={isSubmitting || totalToStock <= 0}
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
              backgroundColor: "#4338ca",
              color: "#fff",
              cursor: isSubmitting || totalToStock <= 0 ? "not-allowed" : "pointer",
              opacity: isSubmitting || totalToStock <= 0 ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {isSubmitting && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            )}
            Dar entrada
          </button>
        </div>
      </div>
    </Dialog>
  );
}