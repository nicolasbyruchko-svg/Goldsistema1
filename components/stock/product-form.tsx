"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/actions/product-actions";
import type { SerializableProduct } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProductFormProps {
  product?: SerializableProduct;
  onSuccess: () => void;
  onCancel: () => void;
}

function toDateInput(value: Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      type: (product?.type ?? "EPI") as ProductFormValues["type"],
      condition: (product?.condition ?? "NOVO") as ProductFormValues["condition"],
      size: product?.size ?? "",
      caNumber: product?.caNumber ?? "",
      caValidity: toDateInput(product?.caValidity),
      unitCost: product?.unitCost != null ? Number(product.unitCost) : 0,
      supplier: product?.supplier ?? "",
      stockQuantity: product?.stockQuantity ?? 0,
      minStock: product?.minStock ?? 5,
    },
  });

  const productType = useWatch({ control, name: "type" });

  const onSubmit = async (data: ProductFormValues) => {
    setServerError(null);
    const result = product
      ? await updateProduct(product.id, data)
      : await createProduct(data);
    if (result.success) {
      router.refresh();
      onSuccess();
    } else {
      setServerError(result.error ?? "Erro desconhecido");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Nome + SKU */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px" }}>
          <div>
            <Label htmlFor="prod-name" required>Nome do Produto</Label>
            <Input
              id="prod-name"
              placeholder="Ex: Capacete de Segurança"
              error={errors.name?.message}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="prod-sku" required>SKU</Label>
            <Input
              id="prod-sku"
              placeholder="CAP-001"
              error={errors.sku?.message}
              style={{ width: "120px" }}
              {...register("sku")}
            />
            <FieldError message={errors.sku?.message} />
          </div>
        </div>

        {/* Tipo + Condição */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <Label htmlFor="prod-type" required>Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select id="prod-type" error={errors.type?.message} {...field}>
                  <option value="EPI">EPI</option>
                  <option value="UNIFORM">Uniforme</option>
                </Select>
              )}
            />
            <FieldError message={errors.type?.message} />
          </div>
          <div>
            <Label htmlFor="prod-condition" required>Condição</Label>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select id="prod-condition" error={errors.condition?.message} {...field}>
                  <option value="NOVO">Novo</option>
                  <option value="HIGIENIZADO">Higienizado</option>
                </Select>
              )}
            />
            <FieldError message={errors.condition?.message} />
          </div>
        </div>

        {/* Tamanho */}
        <div>
          <Label htmlFor="prod-size">Tamanho</Label>
          <Input
            id="prod-size"
            placeholder="Ex: M, G, 42, 44..."
            {...register("size")}
          />
        </div>

        {/* CA (apenas para EPI) */}
        {productType === "EPI" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              padding: "14px",
              backgroundColor: "rgba(25,55,109,0.04)",
              borderRadius: "8px",
              border: "1px solid rgba(25,55,109,0.1)",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div>
              <Label htmlFor="prod-ca">Nº do CA</Label>
              <Input
                id="prod-ca"
                placeholder="Ex: 12345"
                {...register("caNumber")}
              />
            </div>
            <div>
              <Label htmlFor="prod-caval">Validade do CA</Label>
              <Input
                id="prod-caval"
                type="date"
                {...register("caValidity")}
              />
            </div>
          </div>
        )}

        {/* Estoque */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <Label htmlFor="prod-stock" required>Qtd. em Estoque</Label>
            <Input
              id="prod-stock"
              type="number"
              min={0}
              error={errors.stockQuantity?.message}
              {...register("stockQuantity", { valueAsNumber: true })}
            />
            <FieldError message={errors.stockQuantity?.message} />
          </div>
          <div>
            <Label htmlFor="prod-min">Estoque Mínimo</Label>
            <Input
              id="prod-min"
              type="number"
              min={0}
              {...register("minStock", { valueAsNumber: true })}
            />
            <FieldError message={errors.minStock?.message} />
          </div>
        </div>

        {/* Custo e Fornecedor */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <Label htmlFor="prod-cost">Custo Unitário (R$)</Label>
            <Input
              id="prod-cost"
              type="number"
              min={0}
              step="0.01"
              placeholder="Ex: 25,90"
              error={errors.unitCost?.message}
              {...register("unitCost", { valueAsNumber: true })}
            />
            <FieldError message={errors.unitCost?.message} />
          </div>
          <div>
            <Label htmlFor="prod-supplier">Fornecedor</Label>
            <Input
              id="prod-supplier"
              placeholder="Ex: Uniformes Brasil LTDA"
              error={errors.supplier?.message}
              {...register("supplier")}
            />
            <FieldError message={errors.supplier?.message} />
          </div>
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
            {product ? "Salvar Alterações" : "Salvar Produto"}
          </Button>
        </div>
      </div>
    </form>
  );
}
