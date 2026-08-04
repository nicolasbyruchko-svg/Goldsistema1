"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import type { SerializableProduct } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/actions/product-actions";

interface DeleteProductButtonProps {
  product: SerializableProduct;
}

export function DeleteProductButton({ product }: DeleteProductButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    const res = await deleteProduct(product.id);
    setBusy(false);
    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error ?? "Erro ao excluir produto");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Excluir produto"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "6px",
          border: "1px solid #fecaca",
          backgroundColor: "#fff",
          color: "#dc2626",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background-color 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#fef2f2";
          e.currentTarget.style.borderColor = "#fca5a5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fff";
          e.currentTarget.style.borderColor = "#fecaca";
        }}
      >
        <Trash2 size={13} strokeWidth={2.5} />
        Excluir
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Excluir Produto"
        description={`Deseja excluir "${product.name}"${product.size ? ` (tamanho ${product.size})` : ""}?`}
        maxWidth="440px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 14px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
            }}
          >
            <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} strokeWidth={2.5} />
            <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              O produto será <strong>removido do catálogo e do estoque</strong>. Os registros anteriores em
              fichas de EPI, entregas, compras e devoluções serão <strong>preservados</strong>.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#dc2626",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              paddingTop: "8px",
              borderTop: "1px solid var(--gray-100)",
            }}
          >
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} loading={busy}>
              {busy ? undefined : <Trash2 size={15} />}
              Excluir
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
