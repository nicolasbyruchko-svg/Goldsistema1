"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { SerializableProduct } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { ProductForm } from "@/components/stock/product-form";

interface EditProductButtonProps {
  product: SerializableProduct;
}

export function EditProductButton({ product }: EditProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "6px",
          border: "1px solid var(--gray-200)",
          backgroundColor: "#fff",
          color: "var(--gray-700)",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background-color 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--gray-50)";
          e.currentTarget.style.borderColor = "var(--gray-300)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fff";
          e.currentTarget.style.borderColor = "var(--gray-200)";
        }}
      >
        <Pencil size={13} strokeWidth={2.5} />
        Editar
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Editar Produto"
        description={`Atualize os dados de "${product.name}".`}
        maxWidth="580px"
      >
        <ProductForm
          product={product}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
