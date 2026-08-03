"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { ProductForm } from "@/components/stock/product-form";

export function NewProductButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="btn-new-product"
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
        Novo Produto
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Novo Produto"
        description="Cadastre um EPI ou uniforme no estoque."
        maxWidth="580px"
      >
        <ProductForm
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
