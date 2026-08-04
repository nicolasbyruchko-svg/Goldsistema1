"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListPlus, Check, Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STANDARDIZED_ITEMS, generateUniqueSku } from "@/lib/stock-standardized-items";
import { createProduct } from "@/actions/product-actions";
import type { ProductFormValues } from "@/lib/validations/product";

interface StandardizedItemButtonProps {
  existingSkus: string[];
}

export function StandardizedItemButton({ existingSkus }: StandardizedItemButtonProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [condition, setCondition] = useState<"NOVO" | "HIGIENIZADO">("NOVO");
  const router = useRouter();

  const filteredItems = STANDARDIZED_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (item: (typeof STANDARDIZED_ITEMS)[number]) => {
    setAdding(item.sku);
    try {
      const sku = generateUniqueSku(item.sku, [...existingSkus, ...Array.from(added)]);
      const data: ProductFormValues = {
        name: item.name,
        sku,
        type: item.type,
        condition,
        size: item.size || "",
        caNumber: item.caNumber || "",
        unitCost: 0,
        stockQuantity: 0,
        minStock: 5,
      };
      const result = await createProduct(data);
      if (result.success) {
        setAdded(new Set([...added, item.sku]));
        existingSkus.push(sku);
        router.refresh();
      }
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          backgroundColor: "#ffffff",
          color: "var(--navy-900)",
          border: "1px solid var(--gray-200)",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          transition: "background-color 0.15s, transform 0.1s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--gray-50)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <ListPlus size={16} strokeWidth={2} />
        Itens Padrão
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Itens Padronizados"
        description="Adicione rapidamente itens pré-cadastrados ao estoque."
        maxWidth="640px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Condition selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-700)" }}>
              Condição:
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCondition("NOVO")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: condition === "NOVO" ? "2px solid #059669" : "1px solid var(--gray-200)",
                  backgroundColor: condition === "NOVO" ? "#d1fae5" : "#ffffff",
                  color: condition === "NOVO" ? "#059669" : "var(--gray-600)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Novo
              </button>
              <button
                type="button"
                onClick={() => setCondition("HIGIENIZADO")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: condition === "HIGIENIZADO" ? "2px solid #0284c7" : "1px solid var(--gray-200)",
                  backgroundColor: condition === "HIGIENIZADO" ? "#e0f2fe" : "#ffffff",
                  color: condition === "HIGIENIZADO" ? "#0284c7" : "var(--gray-600)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Higienizado
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--gray-400)",
              }}
            />
            <Input
              placeholder="Buscar item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
          </div>

          {/* Items list */}
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredItems.map((item) => {
              const isAdded = added.has(item.sku);
              const isAdding = adding === item.sku;
              return (
                <div
                  key={item.sku}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: isAdded ? "#f0fdf4" : "#ffffff",
                    border: `1px solid ${isAdded ? "#bbf7d0" : "var(--gray-200)"}`,
                    borderRadius: "8px",
                    opacity: isAdding ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: item.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.type === "EPI" ? (
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--navy-800)" }}>EPI</span>
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7" }}>UNI</span>
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--gray-900)", margin: 0 }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--gray-500)", margin: 0 }}>
                        {item.sku}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isAdded ? "ghost" : "primary"}
                    onClick={() => handleAdd(item)}
                    disabled={isAdded || isAdding}
                    style={{ minWidth: "100px" }}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} /> Adicionado
                      </>
                    ) : isAdding ? (
                      "Adicionando..."
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--gray-400)", padding: "32px 0" }}>
                <p style={{ fontSize: "14px", margin: 0 }}>Nenhum item encontrado.</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--gray-100)" }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
