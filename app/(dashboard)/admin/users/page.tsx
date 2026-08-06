import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listUsers } from "@/actions/user-actions";
import { UsersPanel } from "@/components/admin/users-panel";

export const metadata: Metadata = {
  title: "Usuários",
  description: "Gestão de usuários e perfis de acesso ao sistema.",
};

export default async function AdminUsersPage() {
  const [current, users] = await Promise.all([getSessionUser(), listUsers()]);

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#e0f2fe",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheck size={20} style={{ color: "#0284c7" }} strokeWidth={2} />
        </div>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--navy-900)",
            letterSpacing: "-0.5px",
            margin: 0,
          }}
        >
          Usuários
        </h1>
      </div>
      <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: "0 0 24px" }}>
        Cadastre e gerencie os acessos ao sistema. Apenas administradores veem
        esta área.
      </p>

      <UsersPanel users={users} currentUserId={current?.id} />
    </div>
  );
}
