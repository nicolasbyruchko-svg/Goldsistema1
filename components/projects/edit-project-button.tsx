"use client";

import { useState } from "react";
import type { Project } from "@prisma/client";
import { Dialog } from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";

interface EditProjectButtonProps {
  project: Project;
}

export function EditProjectButton({ project }: EditProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "6px",
          border: "1px solid var(--gray-200)",
          backgroundColor: "#fff",
          color: "var(--gray-700)",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--gray-50)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gray-300)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gray-200)";
        }}
      >
        Editar
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Editar Contrato"
        description="Altere o nome, descrição ou status do contrato."
      >
        <ProjectForm
          initialData={project}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
