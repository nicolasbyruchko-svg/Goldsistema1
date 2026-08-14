"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, PackagePlus } from "lucide-react";
import type { Worker } from "@prisma/client";
import type { SerializableProduct } from "@/lib/types";
import { deliverySchema, type DeliveryFormValues } from "@/lib/validations/delivery";
import { createDelivery } from "@/actions/delivery-actions";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeliveryFormProps {
  workers: Worker[];
  products: SerializableProduct[];
  onSuccess: () => void;
  onCancel: () => void;
}

const REASON_LABELS: Record<string, string> = {
  FIRST_DELIVERY: "Primeira Entrega",
  REPLACEMENT_WEAR: "Reposição por Desgaste",
  REPLACEMENT_LOSS: "Reposição por Perda/Extravio",
  RETURN_TO_WORK: "Retorno ao trabalho",
  SIZE_EXCHANGE: "Troca por tamanho",
};

export function DeliveryForm({ workers, products, onSuccess, onCancel }: DeliveryFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      workerId: "",
      items: [{ productId: "", quantity: 1, reason: "FIRST_DELIVERY" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (data: DeliveryFormValues) => {
    setServerError(null);
    const result = await createDelivery(data);
    if (result.success) {
      router.refresh();
      onSuccess();
    } else {
      setServerError(result.error ?? "Erro ao criar entrega");
    }
  };

  const activeWorkers = workers.filter((w) => w.active);
  const availableProducts = products.filter((p) => p.stockQuantity > 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Trabalhador */}
        <div>
          <Label htmlFor="del-worker" required>
            Trabalhador
          </Label>
          <Controller
            name="workerId"
            control={control}
            render={({ field }) => (
              <Select
                id="del-worker"
                error={errors.workerId?.message}
                {...field}
              >
                <option value="">— Selecione o trabalhador —</option>
                {activeWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.matricula} — {w.name} ({w.role})
                  </option>
                ))}
              </Select>
            )}
          />
          <FieldError message={errors.workerId?.message} />
        </div>

        {/* Itens da Entrega */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <Label style={{ margin: 0 }}>Itens da Entrega</Label>
            <button
              type="button"
              onClick={() =>
                append({ productId: "", quantity: 1, reason: "FIRST_DELIVERY" })
              }
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
                  gridTemplateColumns: "1fr 80px 1fr auto",
                  gap: "10px",
                  alignItems: "start",
                  padding: "14px",
                  backgroundColor: "var(--gray-50)",
                  borderRadius: "10px",
                  border: "1px solid var(--gray-200)",
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                {/* Produto */}
                <div>
                  <Label htmlFor={`item-${idx}-product`} style={{ fontSize: "12px" }}>
                    Produto
                  </Label>
                  <Controller
                    name={`items.${idx}.productId`}
                    control={control}
                    render={({ field: f }) => (
                       <Select
                         id={`item-${idx}-product`}
                         error={errors.items?.[idx]?.productId?.message}
                         {...f}
                       >
                         <option value="">— Selecione —</option>
                         {availableProducts.map((p) => (
                           <option key={p.id} value={p.id}>
                             {p.name} {p.size ? `(${p.size})` : ""} — {p.condition === "NOVO" ? "Novo" : "Hig."} — Est: {p.stockQuantity}
                           </option>
                         ))}
                       </Select>
                    )}
                  />
                  <FieldError message={errors.items?.[idx]?.productId?.message} />
                </div>

                {/* Quantidade */}
                <div>
                  <Label htmlFor={`item-${idx}-qty`} style={{ fontSize: "12px" }}>
                    Qtd.
                  </Label>
                  <Input
                    id={`item-${idx}-qty`}
                    type="number"
                    min={1}
                    error={errors.items?.[idx]?.quantity?.message}
                    {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                  />
                  <FieldError message={errors.items?.[idx]?.quantity?.message} />
                </div>

                {/* Motivo */}
                <div>
                  <Label htmlFor={`item-${idx}-reason`} style={{ fontSize: "12px" }}>
                    Motivo
                  </Label>
                  <Controller
                    name={`items.${idx}.reason`}
                    control={control}
                    render={({ field: f }) => (
                      <Select id={`item-${idx}-reason`} {...f}>
                        {Object.entries(REASON_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                </div>

                {/* Remover */}
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

        {availableProducts.length === 0 && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fef9c3",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <PackagePlus size={16} />
            Não há produtos com estoque disponível. Cadastre itens no Estoque primeiro.
          </div>
        )}

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
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={availableProducts.length === 0}
          >
            Registrar Entrega
          </Button>
        </div>
      </div>
    </form>
  );
}
