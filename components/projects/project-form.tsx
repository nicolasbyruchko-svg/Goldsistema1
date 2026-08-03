"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Project } from "@prisma/client";
import { projectSchema, type ProjectFormValues } from "@/lib/validations/project";
import { createProject, updateProject } from "@/actions/project-actions";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ProjectFormProps {
  initialData?: Project;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectForm({ initialData, onSuccess, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          description: initialData.description || "",
          costCenterCode: initialData.costCenterCode || "",
          active: initialData.active ?? true,
        }
      : { name: "", description: "", costCenterCode: "", active: true },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setServerError(null);
    let result;
    if (initialData?.id) {
      result = await updateProject(initialData.id, data);
    } else {
      result = await createProject(data);
    }

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
        <div>
          <Label htmlFor="proj-name" required>
            Nome do Contrato / Posto
          </Label>
          <Input
            id="proj-name"
            placeholder="Ex: Condomínio Solar da Serra"
            error={errors.name?.message}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="proj-desc">Descrição</Label>
          <Textarea
            id="proj-desc"
            placeholder="Endereço, contato, observações..."
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div>
          <Label htmlFor="proj-cc">Código do Centro de Custo</Label>
          <Input
            id="proj-cc"
            placeholder="Ex: CC-0012 (código ERP/contábil)"
            error={errors.costCenterCode?.message}
            {...register("costCenterCode")}
          />
          <FieldError message={errors.costCenterCode?.message} />
        </div>

        {initialData && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="proj-active"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
              )}
            />
            <Label htmlFor="proj-active" style={{ marginBottom: 0, cursor: "pointer" }}>
              Contrato Ativo no Sistema
            </Label>
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
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {initialData ? "Salvar Alterações" : "Salvar Contrato"}
          </Button>
        </div>
      </div>
    </form>
  );
}
