"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, PackageCheck, PackageX, Info, Sofa, Clock } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { approveDevolution } from "@/actions/devolution-actions";

const CONDITION_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  GOOD: { label: "Bom estado", bg: "#dcfce7", color: "#15803d" },
  SEWING: { label: "Costura", bg: "#e0e7ff", color: "#4338ca" },
  DAMAGED: { label: "Rasgado / Deteriorado", bg: "#fef3c7", color: "#92400e" },
  UNUSABLE: { label: "Não utilizável", bg: "#fee2e2", color: "#dc2626" },
};

interface DevolutionItem {
  id: string;
  quantity: number;
  condition: string;
  approvedQty: number | null;
  rejectedQty: number;
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

  const approvableItems = devolution.items.filter((i) => i.condition === "GOOD");
  const sewingItems = devolution.items.filter((i) => i.condition === "SEWING");
  const autoDiscardItems = devolution.items.filter((i) => i.condition !== "GOOD" && i.condition !== "SEWING");
  const hasAutoDiscard = autoDiscardItems.length > 0;
  const hasSewing = sewingItems.length > 0;

  const [approvals, setApprovals] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      approvableItems.map((item) => [item.id, item.approvedQty ?? 0])
    )
  );
  const [rejections, setRejections] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      approvableItems.map((item) => [item.id, item.rejectedQty ?? 0])
    )
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const getItemState = useCallback((item: DevolutionItem) => {
    const approved = approvals[item.id] ?? 0;
    const rejected = rejections[item.id] ?? 0;
    const maxForApproved = item.quantity - rejected;
    const maxForRejected = item.quantity - approved;
    const clampedApproved = Math.min(approved, maxForApproved);
    const clampedRejected = Math.min(rejected, maxForRejected);
    const pending = item.quantity - clampedApproved - clampedRejected;
    return { approved: clampedApproved, rejected: clampedRejected, pending };
  }, [approvals, rejections]);

  const setApprovedQty = (itemId: string, qty: number) => {
    const item = approvableItems.find((i) => i.id === itemId);
    if (!item) return;
    const prevRejected = rejections[itemId] ?? 0;
    const min = item.approvedQty ?? 0;
    const maxAllowed = item.quantity - prevRejected;
    const clamped = Math.min(Math.max(Math.round(qty) || 0, min), maxAllowed);
    setApprovals((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const setRejectedQty = (itemId: string, qty: number) => {
    const item = approvableItems.find((i) => i.id === itemId);
    if (!item) return;
    const prevApproved = approvals[itemId] ?? 0;
    const maxAllowed = item.quantity - prevApproved;
    const clamped = Math.min(Math.max(Math.round(qty) || 0, 0), maxAllowed);
    setRejections((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const handleApproveAll = () => {
    const newApprovals: Record<string, number> = {};
    const newRejections: Record<string, number> = {};
    for (const item of approvableItems) {
      newApprovals[item.id] = item.quantity;
      newRejections[item.id] = 0;
    }
    setApprovals(newApprovals);
    setRejections(newRejections);
  };

  const handleRejectAll = () => {
    const newApprovals: Record<string, number> = {};
    const newRejections: Record<string, number> = {};
    for (const item of approvableItems) {
      newApprovals[item.id] = item.approvedQty ?? 0;
      newRejections[item.id] = item.quantity - (item.approvedQty ?? 0);
    }
    setApprovals(newApprovals);
    setRejections(newRejections);
  };

  const handlePendingAll = () => {
    const newApprovals: Record<string, number> = {};
    const newRejections: Record<string, number> = {};
    for (const item of approvableItems) {
      newApprovals[item.id] = item.approvedQty ?? 0;
      newRejections[item.id] = item.rejectedQty ?? 0;
    }
    setApprovals(newApprovals);
    setRejections(newRejections);
  };

  const summary = useMemo(() => {
    let stockQty = 0;
    let pendingQty = 0;
    let rejectedQty = 0;
    let discardQty = 0;
    let repairQty = 0;
    let newApprovals = 0;
    for (const item of approvableItems) {
      const state = getItemState(item);
      const previousApproved = item.approvedQty ?? 0;
      stockQty += state.approved;
      newApprovals += Math.max(0, state.approved - previousApproved);
      pendingQty += state.pending;
      rejectedQty += state.rejected;
    }
    for (const item of autoDiscardItems) {
      discardQty += item.quantity;
    }
    for (const item of sewingItems) {
      repairQty += item.quantity;
    }
    return { stockQty, pendingQty, rejectedQty, discardQty, repairQty, newApprovals };
  }, [approvableItems, autoDiscardItems, sewingItems, approvals, rejections, getItemState]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setServerError(null);

    const itemApprovals = devolution.items.map((item) => {
      if (item.condition === "GOOD") {
        const state = getItemState(item);
        return { itemId: item.id, approvedQty: state.approved, rejectedQty: state.rejected };
      }
      return { itemId: item.id, approvedQty: 0, rejectedQty: 0 };
    });

    const result = await approveDevolution(
      devolution.id,
      itemApprovals,
      notes
    );

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setServerError(result.error);
    }
    setIsSubmitting(false);
  };

  const allDecided = approvableItems.every((item) => {
    const state = getItemState(item);
    return state.approved + state.rejected === item.quantity;
  });
  const hasPreviousDecisions = approvableItems.some(
    (item) => (item.approvedQty ?? 0) > 0 || (item.rejectedQty ?? 0) > 0
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Aprovar Devolução"
      description={
        hasPreviousDecisions
          ? `Aprovação parcial de ${devolution.worker.name}. Itens já processados estão bloqueados. Itens rasgados ou não utilizáveis são descartados automaticamente.`
          : `Triagem dos itens devolvidos por ${devolution.worker.name}. Itens rasgados ou não utilizáveis são descartados automaticamente.`
      }
      maxWidth="780px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Quick actions */}
        {approvableItems.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
              onClick={handlePendingAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "inherit",
                borderRadius: "6px",
                border: "1px solid #fde68a",
                backgroundColor: "#fefce8",
                color: "#92400e",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef9c3"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fefce8"; }}
            >
              <Clock size={13} />
              Manter pendente
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
        )}

        {/* Approvable items (Bom estado) */}
        {approvableItems.length > 0 && (
          <div>
            <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--gray-700)", marginBottom: "8px" }}>
              Itens em bom estado — distribua as peças entre aprovado, pendente e reprovado
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {approvableItems.map((item) => {
                const state = getItemState(item);
                const previousApproved = item.approvedQty ?? 0;
                const previousRejected = item.rejectedQty ?? 0;
                const isLocked = previousApproved > 0 || previousRejected > 0;

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
                            backgroundColor: CONDITION_CONFIG[item.condition].bg,
                            color: CONDITION_CONFIG[item.condition].color,
                          }}
                        >
                          {CONDITION_CONFIG[item.condition].label}
                        </span>
                        {isLocked && (
                          <span
                            style={{
                              display: "inline-block",
                              marginLeft: "6px",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: "#e0e7ff",
                              color: "#4338ca",
                            }}
                          >
                            Parcialmente processado
                          </span>
                        )}
                      </div>
                      {state.pending === 0 && (
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={13} />
                          Totalmente decidido
                        </span>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      {/* Aprovar */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          backgroundColor: "#f0fdf4",
                          borderRadius: "8px",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <PackageCheck size={15} style={{ color: "#15803d", flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d", whiteSpace: "nowrap" }}>Aprovar</span>
                        <input
                          type="number"
                          min={previousApproved}
                          max={item.quantity - (rejections[item.id] ?? 0)}
                          value={state.approved}
                          onChange={(e) => setApprovedQty(item.id, Number(e.target.value))}
                          style={{
                            width: "50px",
                            padding: "5px 6px",
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

                      {/* Pendente */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          backgroundColor: "#fefce8",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <Clock size={15} style={{ color: "#92400e", flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", whiteSpace: "nowrap" }}>Pendente</span>
                        <span
                          style={{
                            width: "50px",
                            padding: "5px 6px",
                            fontSize: "14px",
                            fontWeight: 700,
                            fontFamily: "inherit",
                            textAlign: "center",
                            borderRadius: "6px",
                            border: "1px solid #fde68a",
                            backgroundColor: "#fff",
                            color: "#92400e",
                          }}
                        >
                          {state.pending}
                        </span>
                      </div>

                      {/* Reprovar */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          backgroundColor: "#fef2f2",
                          border: "1px solid #fecaca",
                        }}
                      >
                        <PackageX size={15} style={{ color: "#dc2626", flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626", whiteSpace: "nowrap" }}>Reprovar</span>
                        <input
                          type="number"
                          min={0}
                          max={item.quantity - (approvals[item.id] ?? 0)}
                          value={state.rejected}
                          onChange={(e) => setRejectedQty(item.id, Number(e.target.value))}
                          style={{
                            width: "50px",
                            padding: "5px 6px",
                            fontSize: "14px",
                            fontWeight: 700,
                            fontFamily: "inherit",
                            textAlign: "center",
                            borderRadius: "6px",
                            border: "1px solid #fca5a5",
                            backgroundColor: "#fff",
                            color: "#dc2626",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sewing items (costura) */}
        {hasSewing && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Sofa size={14} style={{ color: "#4338ca" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-700)" }}>
                Itens em costura / reparo (não voltam ao estoque agora)
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sewingItems.map((item) => (
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
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--gray-900)" }}>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: CONDITION_CONFIG[item.condition].bg,
                      color: CONDITION_CONFIG[item.condition].color,
                    }}
                  >
                    {CONDITION_CONFIG[item.condition].label}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#4338ca", whiteSpace: "nowrap" }}>REPARO</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-discard items (rasgado / não utilizável) */}
        {hasAutoDiscard && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <AlertTriangle size={14} style={{ color: "#92400e" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-700)" }}>
                Descartados automaticamente (sem aprovação)
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {autoDiscardItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    backgroundColor: "#fef2f2",
                    borderRadius: "10px",
                    border: "1px solid #fecaca",
                  }}
                >
                  <PackageX size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--gray-900)" }}>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: CONDITION_CONFIG[item.condition].bg,
                      color: CONDITION_CONFIG[item.condition].color,
                    }}
                  >
                    {CONDITION_CONFIG[item.condition].label}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", whiteSpace: "nowrap" }}>DESCARTE</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: (() => {
              let cols = 1;
              if (summary.pendingQty > 0) cols++;
              if (summary.rejectedQty > 0) cols++;
              if (summary.discardQty > 0) cols++;
              if (hasSewing) cols++;
              return `repeat(${cols}, 1fr)`;
            })(),
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
                {summary.newApprovals > 0 ? "Entrando agora" : "Total aprovado"}
              </span>
              <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#15803d" }}>
                {summary.newApprovals > 0 ? `+${summary.newApprovals}` : summary.stockQty}
              </span>
            </div>
          </div>
          {summary.pendingQty > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={16} style={{ color: "#92400e" }} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--gray-500)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Pendentes
                </span>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#92400e" }}>
                  {summary.pendingQty}
                </span>
              </div>
            </div>
          )}
          {summary.rejectedQty > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PackageX size={16} style={{ color: "#dc2626" }} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--gray-500)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Reprovados
                </span>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#dc2626" }}>
                  {summary.rejectedQty}
                </span>
              </div>
            </div>
          )}
          {hasSewing && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sofa size={16} style={{ color: "#4338ca" }} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--gray-500)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Em reparo
                </span>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#4338ca" }}>
                  {summary.repairQty}
                </span>
              </div>
            </div>
          )}
          {summary.discardQty > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={16} style={{ color: "#92400e" }} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: "var(--gray-500)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Descartados auto
                </span>
                <span style={{ display: "block", fontSize: "20px", fontWeight: 800, color: "#92400e" }}>
                  {summary.discardQty}
                </span>
              </div>
            </div>
          )}
        </div>

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
              backgroundColor: "#059669",
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
            {allDecided ? "Confirmar triagem" : "Salvar parcial"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
