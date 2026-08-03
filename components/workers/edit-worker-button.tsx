"use client";

import { useState } from "react";
import type { Project, Worker } from "@prisma/client";
import { Dialog } from "@/components/ui/dialog";
import { WorkerForm } from "./worker-form";

interface EditWorkerButtonProps {
  projects: Project[];
  worker: Worker;
}

export function EditWorkerButton({ projects, worker }: EditWorkerButtonProps) {
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
        }}
      >
        Editar
      </button>
      
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        title="Editar Trabalhador"
        maxWidth="600px"
      >
        <WorkerForm 
          projects={projects} 
          initialData={worker}
          onSuccess={() => setOpen(false)} 
          onCancel={() => setOpen(false)} 
        />
      </Dialog>
    </>
  );
}
