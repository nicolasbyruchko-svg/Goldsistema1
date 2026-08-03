"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Project, Worker } from "@prisma/client";
import { workerSchema, type WorkerFormValues } from "@/lib/validations/worker";
import { createWorker, updateWorker } from "@/actions/worker-actions";
import { formatCPF } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface WorkerFormProps {
  projects: Project[];
  initialData?: Worker;
  onSuccess: () => void;
  onCancel: () => void;
}

const ROLES = [
  "Auxiliar de Limpeza",
  "Porteiro",
  "Jardineiro",
  "Supervisor",
  "Recepcionista",
  "Vigilante",
  "Técnico de Manutenção",
];

export function WorkerForm({ projects, initialData, onSuccess, onCancel }: WorkerFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: initialData ? {
      ...initialData,
      admissionDate: initialData.admissionDate
        ? new Date(initialData.admissionDate).toISOString().split("T")[0]
        : null,
    } : {
      matricula: "",
      name: "",
      cpf: "",
      role: "",
      admissionDate: null,
      projectId: null,
      active: true,
    },
  });

  const onSubmit = async (data: WorkerFormValues) => {
    setServerError(null);
    let result;
    
    if (initialData?.id) {
      result = await updateWorker(initialData.id, data);
    } else {
      result = await createWorker(data);
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
        {/* Grid 2 colunas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Matrícula */}
          <div>
            <Label htmlFor="matricula" required>
              Matrícula
            </Label>
            <Input
              id="matricula"
              placeholder="Ex: 00123"
              error={errors.matricula?.message}
              {...register("matricula")}
            />
            <FieldError message={errors.matricula?.message} />
          </div>

          {/* CPF com máscara */}
          <div>
            <Label htmlFor="cpf" required>
              CPF
            </Label>
            <Controller
              name="cpf"
              control={control}
              render={({ field }) => (
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  error={errors.cpf?.message}
                  value={field.value}
                  onChange={(e) => {
                    const masked = formatCPF(e.target.value);
                    field.onChange(masked);
                  }}
                  onBlur={field.onBlur}
                  inputMode="numeric"
                />
              )}
            />
            <FieldError message={errors.cpf?.message} />
          </div>
        </div>

        {/* Nome completo */}
        <div>
          <Label htmlFor="name" required>
            Nome Completo
          </Label>
          <Input
            id="name"
            placeholder="Ex: João da Silva"
            error={errors.name?.message}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        {/* Função */}
        <div>
          <Label htmlFor="role" required>
            Função
          </Label>
          <Input
            id="role"
            placeholder="Ex: Auxiliar de Limpeza"
            list="role-suggestions"
            error={errors.role?.message}
            {...register("role")}
          />
          <datalist id="role-suggestions">
            {ROLES.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <FieldError message={errors.role?.message} />
        </div>

        {/* Data de admissão */}
        <div>
          <Label htmlFor="admissionDate">Data de Admissão</Label>
          <Input
            id="admissionDate"
            type="date"
            error={errors.admissionDate?.message}
            {...register("admissionDate")}
          />
          <FieldError message={errors.admissionDate?.message} />
        </div>

        {/* Contrato */}
        <div>
          <Label htmlFor="projectId">Contrato (Posto de Trabalho)</Label>
          <Select
            id="projectId"
            error={errors.projectId?.message}
            {...register("projectId")}
            onChange={(e) => {
              setValue("projectId", e.target.value || null, {
                shouldValidate: true,
              });
            }}
          >
            <option value="">— Sem contrato —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <FieldError message={errors.projectId?.message} />
        </div>

        {/* Status Ativo (apenas na edição) */}
        {initialData && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <input 
                  type="checkbox" 
                  id="active"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
              )}
            />
            <Label htmlFor="active" style={{ marginBottom: 0, cursor: "pointer" }}>
              Trabalhador Ativo no Sistema
            </Label>
          </div>
        )}

        {/* Erro do servidor */}
        {serverError && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#dc2626",
              animation: "fadeIn 0.2s ease-out",
            }}
            role="alert"
          >
            {serverError}
          </div>
        )}

        {/* Ações */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            paddingTop: "8px",
            borderTop: "1px solid var(--gray-100)",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {initialData ? "Salvar Alterações" : "Salvar Trabalhador"}
          </Button>
        </div>
      </div>
    </form>
  );
}
