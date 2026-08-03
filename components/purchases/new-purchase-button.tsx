"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { SerializableProduct } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { PurchaseForm } from "@/components/purchases/purchase-form";

interface NewPurchaseButtonProps {
  products: SerializableProduct[];
}

export function NewPurchaseButton({ products }: NewPurchaseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="btn-new-purchase"
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          backgroundColor: "var(--yellow-primary)",
          color: "var(--navy-900)",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(255,217,61,0.4)",
          transition: "background-color 0.15s, transform 0.1s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--yellow-hover)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--yellow-primary)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Nova Nota Fiscal
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Registrar Nota Fiscal"
        description="Registre a entrada de EPIs/uniformes por nota fiscal — o estoque e o custo unitário são atualizados automaticamente."
        maxWidth="720px"
      >
        <PurchaseForm
          products={products}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
