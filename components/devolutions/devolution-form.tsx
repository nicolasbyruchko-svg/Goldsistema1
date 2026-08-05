"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Undo2 } from "lucide-react";
import type { Worker } from "@prisma/client";
import type { SerializableProduct } from "@/lib/types";
import { devolutionSchema, type DevolutionFormValues } from "@/lib/validations/devolution";
import { createDevolution } from "@/actions/devolution-actions";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DevolutionFormProps {
  workers: Worker[];
  products: SerializableProduct[];
  onSuccess: () => void;
  onCancel: () => void;
}

const REASON_LABELS: Record<string, string> = {
  DISMISSAL: "Desligamento do Colaborador",
  EXCHANGE: "Troca / Devolução Parcial",
};

const CONDITION_LABELS: Record<string, string> = {
  GOOD: "Bom estado (volta ao estoque)",
  DAMAGED: "Rasgado / Deteriorado (descarte)",
  UNUSABLE: "Não utilizável (descarte)",
  SEWING: "Costura / reparo",
};

export function DevolutionForm({ workers, products, onSuccess, onCancel }: DevolutionFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DevolutionFormValues>({
    resolver: zodResolver(devolutionSchema),
    defaultValues: {
      workerId: "",
      reason: "DISMISSAL",
      devolvedAt: new Date().toISOString().slice(0, 10),
      items: [{ productId: "", quantity: 1, condition: "GOOD" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (data: DevolutionFormValues) => {
    setServerError(null);
    const result = await createDevolution(data);
    if (result.success) {
      router.refresh();
      onSuccess();
    } else {
      setServerError(result.error ?? "Erro ao registrar devolução");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Trabalhador */}
        <div>
          <Label htmlFor="dev-worker" required>
            Colaborador
          </Label>
          <Controller
            name="workerId"
            control={control}
            render={({ field }) => (
              <Select
                id="dev-worker"
                error={errors.workerId?.message}
                {...field}
              >
                <option value="">— Selecione o colaborador —</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.matricula} — {w.name} ({w.role})
                    {w.active ? "" : " — inativo"}
                  </option>
                ))}
              </Select>
            )}
          />
          <FieldError message={errors.workerId?.message} />
        </div>

        {/* Motivo + Data */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <Label htmlFor="dev-reason" required>
              Motivo
            </Label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Select id="dev-reason" error={errors.reason?.message} {...field}>
                  {Object.entries(REASON_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FieldError message={errors.reason?.message} />
          </div>
          <div>
            <Label htmlFor="dev-date" required>
              Data da Devolução
            </Label>
            <Input
              id="dev-date"
              type="date"
              error={errors.devolvedAt?.message}
              {...register("devolvedAt")}
            />
            <FieldError message={errors.devolvedAt?.message} />
          </div>
        </div>

        {/* Itens da Devolução */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <Label style={{ margin: 0 }}>Itens Devolvidos</Label>
            <button
              type="button"
              onClick={() =>
                append({ productId: "", quantity: 1, condition: "GOOD" })
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
                  gridTemplateColumns: "1fr 70px 1fr auto",
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
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.size ? `(${p.size})` : ""} — Est: {p.stockQuantity}
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

                {/* Estado do item */}
                <div>
                  <Label htmlFor={`item-${idx}-condition`} style={{ fontSize: "12px" }}>
                    Estado
                  </Label>
                  <Controller
                    name={`items.${idx}.condition`}
                    control={control}
                    render={({ field: f }) => (
                      <Select
                        id={`item-${idx}-condition`}
                        error={errors.items?.[idx]?.condition?.message}
                        {...f}
                      >
                        {Object.entries(CONDITION_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  <FieldError message={errors.items?.[idx]?.condition?.message} />
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

          <p
            style={{
              fontSize: "12px",
              color: "var(--gray-500)",
              margin: "10px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Undo2 size={13} style={{ color: "#059669" }} />
            Apenas itens em <strong>Bom estado</strong> são reincorporados ao estoque. Itens
            rasgados ou não utilizáveis são descartados.
          </p>
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
            Registrar Devolução
          </Button>
        </div>
      </div>
    </form>
  );
}
