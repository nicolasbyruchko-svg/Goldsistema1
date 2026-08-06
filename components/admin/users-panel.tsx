"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  ShieldCheck,
  HardHat,
  AlertTriangle,
} from "lucide-react";
import {
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
  type SerializedUser,
} from "@/actions/user-actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label, FieldError } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

type FormValues = {
  name: string;
  username: string;
  password: string;
  role: "ADMIN" | "OPERATOR";
  active: boolean;
};

const EMPTY_FORM: FormValues = {
  name: "",
  username: "",
  password: "",
  role: "OPERATOR",
  active: true,
};

export function UsersPanel({
  users,
  currentUserId,
}: {
  users: SerializedUser[];
  currentUserId: string | undefined;
}) {
  const router = useRouter();

  const [editing, setEditing] = useState<SerializedUser | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<SerializedUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setOpen(true);
  };

  const openEdit = (user: SerializedUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role === "ADMIN" ? "ADMIN" : "OPERATOR",
      active: user.active,
    });
    setFieldErrors({});
    setSubmitError(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSubmitError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome";
    if (form.username.trim().length < 3)
      errors.username = "O login deve ter ao menos 3 caracteres";
    if (editing) {
      if (form.password && form.password.length < 6)
        errors.password = "A senha deve ter ao menos 6 caracteres";
    } else if (form.password.length < 6) {
      errors.password = "A senha deve ter ao menos 6 caracteres";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setBusy(false);
      return;
    }

    const res = editing
      ? await updateUser(editing.id, {
          name: form.name,
          username: form.username,
          role: form.role,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        })
      : await createUser({
          name: form.name,
          username: form.username,
          role: form.role,
          active: form.active,
          password: form.password,
        });

    setBusy(false);
    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      setSubmitError(res.error);
    }
  };

  const handleToggleActive = async (user: SerializedUser) => {
    const res = await toggleUserActive(user.id, !user.active);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const res = await deleteUser(deleting.id);
    setDeleteBusy(false);
    if (res.success) {
      setDeleting(null);
      router.refresh();
    } else {
      setDeleteError(res.error);
    }
  };

  const isSelf = (id: string) => id === currentUserId;

  return (
    <div>
      {/* Barra de ações */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <Button type="button" onClick={openCreate}>
          <Plus size={16} />
          Novo usuário
        </Button>
      </div>

      {/* Tabela */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid var(--gray-200)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            minWidth: "720px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-200)" }}>
              {["Usuário", "Perfil", "Status", "Criado em", "Ações"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--gray-500)",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: "36px 16px", textAlign: "center", color: "var(--gray-400)" }}
                >
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isCurrent = isSelf(user.id);
                const isAdmin = user.role === "ADMIN";
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid var(--gray-100)",
                      transition: "background-color 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--gray-50)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            backgroundColor: isAdmin ? "#fef3c7" : "#e0f2fe",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isAdmin ? (
                            <ShieldCheck size={16} style={{ color: "#d97706" }} />
                          ) : (
                            <HardHat size={16} style={{ color: "#0284c7" }} />
                          )}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: "var(--gray-900)" }}>
                            {user.name}
                            {isCurrent && (
                              <span style={{ color: "var(--gray-400)", fontWeight: 400, marginLeft: "6px" }}>
                                (você)
                              </span>
                            )}
                          </p>
                          <p style={{ margin: "1px 0 0", fontSize: "12px", color: "var(--gray-500)" }}>
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: isAdmin ? "#fef3c7" : "#e0f2fe",
                          color: isAdmin ? "#b45309" : "#0369a1",
                        }}
                      >
                        {isAdmin ? "Administrador" : "Operador"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                          color: user.active ? "#15803d" : "#9ca3af",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: user.active ? "var(--success)" : "var(--gray-400)",
                            display: "inline-block",
                          }}
                        />
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--gray-500)", fontSize: "13px" }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => openEdit(user)}
                          style={iconBtnStyle}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--gray-100)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title={user.active ? "Inativar" : "Ativar"}
                          disabled={isCurrent}
                          onClick={() => handleToggleActive(user)}
                          style={{ ...iconBtnStyle, opacity: isCurrent ? 0.4 : 1, cursor: isCurrent ? "not-allowed" : "pointer" }}
                          onMouseEnter={(e) => {
                            if (!isCurrent)
                              e.currentTarget.style.backgroundColor = "var(--gray-100)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          {user.active ? (
                            <UserX size={15} style={{ color: "#d97706" }} />
                          ) : (
                            <UserCheck size={15} style={{ color: "#15803d" }} />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Excluir"
                          disabled={isCurrent}
                          onClick={() => {
                            setDeleting(user);
                            setDeleteError(null);
                          }}
                          style={{ ...iconBtnStyle, opacity: isCurrent ? 0.4 : 1, cursor: isCurrent ? "not-allowed" : "pointer" }}
                          onMouseEnter={(e) => {
                            if (!isCurrent)
                              e.currentTarget.style.backgroundColor = "#fee2e2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <Trash2 size={15} style={{ color: isCurrent ? "var(--gray-300)" : "#dc2626" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog de criação/edição */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar usuário" : "Novo usuário"}
        description={
          editing
            ? "Atualize os dados de acesso. Deixe a senha em branco para mantê-la."
            : "Cadastre um usuário com login, senha e perfil de acesso."
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <Label htmlFor="user-name" required>
                Nome
              </Label>
              <Input
                id="user-name"
                value={form.name}
                error={fieldErrors.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: João da Silva"
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <Label htmlFor="user-username" required>
                  Login
                </Label>
                <Input
                  id="user-username"
                  autoComplete="off"
                  value={form.username}
                  error={fieldErrors.username}
                  onChange={(e) => set("username", e.target.value)}
                  placeholder="ex: joao.silva"
                />
                <FieldError message={fieldErrors.username} />
              </div>
              <div>
                <Label htmlFor="user-password" required={!editing}>
                  Senha
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  error={fieldErrors.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={editing ? "•••••• (manter)" : "Mínimo 6 caracteres"}
                />
                <FieldError message={fieldErrors.password} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <Label htmlFor="user-role" required>
                  Tipo de usuário
                </Label>
                <Select
                  id="user-role"
                  value={form.role}
                  onChange={(e) =>
                    set("role", e.target.value === "ADMIN" ? "ADMIN" : "OPERATOR")
                  }
                >
                  <option value="OPERATOR">Operador</option>
                  <option value="ADMIN">Administrador</option>
                </Select>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingTop: "24px",
                }}
              >
                <input
                  id="user-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--navy-800)" }}
                />
                <label
                  htmlFor="user-active"
                  style={{ fontSize: "14px", color: "var(--gray-700)", cursor: "pointer" }}
                >
                  Usuário ativo
                </label>
              </div>
            </div>

            <FieldError message={submitError ?? undefined} />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "8px",
                paddingTop: "16px",
                borderTop: "1px solid var(--gray-100)",
              }}
            >
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button type="submit" loading={busy}>
                {editing ? "Salvar alterações" : "Cadastrar usuário"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Dialog de exclusão */}
      <Dialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir usuário"
        description="Esta ação remove permanentemente o usuário do sistema."
        maxWidth="460px"
      >
        <div>
          {deleting && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                marginBottom: "16px",
              }}
            >
              <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} strokeWidth={2.5} />
              <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                Você está excluindo <strong>{deleting.name}</strong> (login{" "}
                <strong>{deleting.username}</strong>). Essa ação não pode ser desfeita.
              </p>
            </div>
          )}

          <FieldError message={deleteError ?? undefined} />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Button type="button" variant="ghost" onClick={() => setDeleting(null)} disabled={deleteBusy}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              loading={deleteBusy}
            >
              <Trash2 size={15} />
              Excluir usuário
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "30px",
  height: "30px",
  borderRadius: "8px",
  border: "1.5px solid var(--gray-200)",
  backgroundColor: "transparent",
  color: "var(--gray-500)",
  cursor: "pointer",
};