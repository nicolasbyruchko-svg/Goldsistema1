"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Worker } from "@prisma/client";
import type { SerializableProduct } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { DeliveryForm } from "@/components/deliveries/delivery-form";

interface NewDeliveryButtonProps {
  workers: Worker[];
  products: SerializableProduct[];
}

export function NewDeliveryButton({ workers, products }: NewDeliveryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="btn-new-delivery"
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
        Nova Entrega
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nova Entrega de EPI"
        description="Selecione o trabalhador e os itens a serem entregues."
        maxWidth="680px"
      >
        <DeliveryForm
          workers={workers}
          products={products}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
