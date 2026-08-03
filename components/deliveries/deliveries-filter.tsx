"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
}

export function DeliveriesFilter({
  projects,
  currentProjectId,
}: {
  projects: ProjectOption[];
  currentProjectId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("projectId", value);
    } else {
      params.delete("projectId");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: 260 }}>
      <Building2 size={15} style={{ color: "var(--gray-400)", flexShrink: 0 }} />
      <Select value={currentProjectId ?? ""} onChange={handleChange} aria-label="Filtrar por contrato">
        <option value="">Todos os contratos</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
