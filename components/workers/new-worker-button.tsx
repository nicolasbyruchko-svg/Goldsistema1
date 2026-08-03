"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Project } from "@prisma/client";
import { Dialog } from "@/components/ui/dialog";
import { WorkerForm } from "@/components/workers/worker-form";

interface NewWorkerButtonProps {
  projects: Project[];
}

export function NewWorkerButton({ projects }: NewWorkerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="btn-new-worker"
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
          transition: "background-color 0.15s, box-shadow 0.15s, transform 0.1s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = "var(--yellow-hover)";
          el.style.boxShadow = "0 4px 16px rgba(255,217,61,0.5)";
          el.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = "var(--yellow-primary)";
          el.style.boxShadow = "0 2px 8px rgba(255,217,61,0.4)";
          el.style.transform = "translateY(0)";
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Novo Trabalhador
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Novo Trabalhador"
        description="Preencha os dados do trabalhador para cadastrá-lo no sistema."
      >
        <WorkerForm
          projects={projects}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
