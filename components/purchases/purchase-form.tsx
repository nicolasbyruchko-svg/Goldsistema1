"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ReceiptText } from "lucide-react";
import type { SerializableProduct } from "@/lib/types";
import { purchaseSchema, type PurchaseFormValues } from "@/lib/validations/purchase";
import { createPurchaseInvoice } from "@/actions/purchase-actions";
import { formatCurrency } from "@/lib/utils";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PurchaseFormProps {
  products: SerializableProduct[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseForm({ products, onSuccess, onCancel }: PurchaseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      nfNumber: "",
      supplier: "",
      issueDate: "",
      items: [{ productId: "", quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = useWatch({ control, name: "items" }) ?? [];
  const total = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0),
    0
  );

  const onSubmit = async (data: PurchaseFormValues) => {
    setServerError(null);
    const result = await createPurchaseInvoice(data);
    if (result.success) {
      router.refresh();
      onSuccess();
    } else {
      setServerError(result.error ?? "Erro ao registrar nota fiscal");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Cabeçalho da NF */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <div>
            <Label htmlFor="purch-nf" required>
              Nº da NF
            </Label>
            <Input
              id="purch-nf"
              placeholder="Ex: 001234"
              error={errors.nfNumber?.message}
              {...register("nfNumber")}
            />
            <FieldError message={errors.nfNumber?.message} />
          </div>
          <div>
            <Label htmlFor="purch-supplier" required>
              Fornecedor
            </Label>
            <Input
              id="purch-supplier"
              placeholder="Ex: Uniformes Brasil LTDA"
              error={errors.supplier?.message}
              {...register("supplier")}
            />
            <FieldError message={errors.supplier?.message} />
          </div>
          <div>
            <Label htmlFor="purch-date" required>
              Data de Emissão
            </Label>
            <Input
              id="purch-date"
              type="date"
              error={errors.issueDate?.message}
              {...register("issueDate")}
            />
            <FieldError message={errors.issueDate?.message} />
          </div>
        </div>

        {/* Itens */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <Label style={{ margin: 0 }}>Itens da Nota</Label>
            <button
              type="button"
              onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "inherit",
                backgroundColor: "rgba(25,55,109,0.07)",
                color: "var(--navy-800)",
                border: "1px solid rgba(25,55,109,0.15)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(25,55,109,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(25,55,109,0.07)";
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Adicionar Item
            </button>
          </div>

          {typeof errors.items?.message === "string" && (
            <FieldError message={errors.items.message} />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {fields.map((field, idx) => (
              <div
                key={field.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 120px auto",
                  gap: "10px",
                  alignItems: "start",
                  padding: "14px",
                  backgroundColor: "var(--gray-50)",
                  borderRadius: "10px",
                  border: "1px solid var(--gray-200)",
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                <div>
                  <Label htmlFor={`purch-${idx}-product`} style={{ fontSize: "12px" }}>
                    Produto
                  </Label>
                  <Controller
                    name={`items.${idx}.productId`}
                    control={control}
                    render={({ field: f }) => (
                      <Select
                        id={`purch-${idx}-product`}
                        error={errors.items?.[idx]?.productId?.message}
                        {...f}
                      >
                        <option value="">— Selecione —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.size ? `(${p.size})` : ""} — {p.sku}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  <FieldError message={errors.items?.[idx]?.productId?.message} />
                </div>

                <div>
                  <Label htmlFor={`purch-${idx}-qty`} style={{ fontSize: "12px" }}>
                    Qtd.
                  </Label>
                  <Input
                    id={`purch-${idx}-qty`}
                    type="number"
                    min={1}
                    step={1}
                    error={errors.items?.[idx]?.quantity?.message}
                    {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                  />
                  <FieldError message={errors.items?.[idx]?.quantity?.message} />
                </div>

                <div>
                  <Label htmlFor={`purch-${idx}-cost`} style={{ fontSize: "12px" }}>
                    Custo Unit. (R$)
                  </Label>
                  <Input
                    id={`purch-${idx}-cost`}
                    type="number"
                    min={0}
                    step="0.01"
                    error={errors.items?.[idx]?.unitCost?.message}
                    {...register(`items.${idx}.unitCost`, { valueAsNumber: true })}
                  />
                  <FieldError message={errors.items?.[idx]?.unitCost?.message} />
                </div>

                <div style={{ paddingTop: "22px" }}>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1}
                    aria-label="Remover item"
                    style={{
                      background: "none",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: fields.length === 1 ? "not-allowed" : "pointer",
                      color: fields.length === 1 ? "var(--gray-300)" : "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (fields.length > 1)
                        e.currentTarget.style.backgroundColor = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            padding: "14px 16px",
            backgroundColor: "rgba(25,55,109,0.05)",
            borderRadius: "10px",
            border: "1px solid rgba(25,55,109,0.1)",
          }}
        >
          <ReceiptText size={16} style={{ color: "var(--navy-800)" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-600)" }}>
            Valor Total da NF:
          </span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--navy-900)" }}>
            {formatCurrency(total)}
          </span>
        </div>

        {serverError && (
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
            {serverError}
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
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Registrar Nota Fiscal
          </Button>
        </div>
      </div>
    </form>
  );
}
