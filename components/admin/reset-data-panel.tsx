"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Trash2, AlertTriangle } from "lucide-react";
import { verifyResetPassword, resetModule, type ResetModule } from "@/actions/admin-actions";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type SectionOption = {
  value: ResetModule;
  label: string;
  description: string;
};

const SECTIONS: SectionOption[] = [
  {
    value: "ALL",
    label: "Todas as movimentações",
    description: "Exclui Entregas, Devoluções e Compras e zera o estoque para 0.",
  },
  {
    value: "DELIVERIES",
    label: "Entregas",
    description: "Exclui todas as entregas registradas.",
  },
  {
    value: "DEVOLUTIONS",
    label: "Devoluções",
    description: "Exclui todas as devoluções registradas.",
  },
  {
    value: "PURCHASES",
    label: "Compras / Notas Fiscais",
    description: "Exclui todas as notas fiscais de compra.",
  },
];

export function ResetDataPanel() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | undefined>(undefined);
  const [checking, setChecking] = useState(false);

  const [selected, setSelected] = useState<ResetModule>("ALL");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setChecking(true);
    setAuthError(undefined);
    const res = await verifyResetPassword(password);
    setChecking(false);
    if (res.valid) {
      setUnlocked(true);
    } else {
      setAuthError("Senha incorreta. Tente novamente.");
    }
  };

  const handleReset = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await resetModule(selected, password);
    setBusy(false);
    setConfirming(false);
    if (res.success) {
      const parts = [
        `${res.data.deliveries} entregas`,
        `${res.data.devolutions} devoluções`,
        `${res.data.purchases} compras`,
      ].filter((p) => !p.endsWith("0 entregas") && !p.endsWith("0 devoluções") && !p.endsWith("0 compras"));
      setResult(
        `Pronto! ${parts.length ? parts.join(", ") : "nada a excluir"}${res.data.stockReset ? " · estoque zerado" : ""}.`
      );
      router.refresh();
    } else {
      setError(res.error ?? "Erro ao zerar dados");
    }
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Aviso */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 18px",
          backgroundColor: "#fef3c7",
          border: "1px solid #fde68a",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <ShieldAlert size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} strokeWidth={2.5} />
        <p style={{ fontSize: "13px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
          Área restrita. As ações abaixo apagam dados de forma <strong>permanente e irreversível</strong>.
        </p>
      </div>

      {!unlocked ? (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "14px",
            border: "1px solid var(--gray-200)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            padding: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#ede9fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock size={18} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
                Acesso Restrito
              </h2>
              <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: "2px 0 0" }}>
                Informe a senha para liberar as opções de exclusão.
              </p>
            </div>
          </div>

          <div style={{ maxWidth: "360px" }}>
            <Label htmlFor="reset-password" required>
              Senha
            </Label>
            <Input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUnlock();
              }}
              placeholder="••••••••"
            />
            <FieldError message={authError} />
            <div style={{ marginTop: "14px" }}>
              <Button type="button" variant="primary" onClick={handleUnlock} loading={checking}>
                Acessar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "14px",
            border: "1px solid var(--gray-200)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            padding: "28px",
          }}
        >
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--navy-900)", margin: "0 0 4px" }}>
            Zerar dados
          </h2>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: "0 0 20px" }}>
            Selecione a seção e confirme a exclusão.
          </p>

          {/* Seleção de seção */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {SECTIONS.map((s) => (
              <label
                key={s.value}
                htmlFor={`sec-${s.value}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: `1.5px solid ${selected === s.value ? "#7c3aed" : "var(--gray-200)"}`,
                  backgroundColor: selected === s.value ? "#f5f3ff" : "#fff",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background-color 0.15s",
                }}
              >
                <input
                  id={`sec-${s.value}`}
                  type="radio"
                  name="section"
                  value={s.value}
                  checked={selected === s.value}
                  onChange={() => {
                    setSelected(s.value);
                    setConfirming(false);
                  }}
                  style={{ marginTop: "3px", accentColor: "#7c3aed" }}
                />
                <span>
                  <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--gray-900)" }}>
                    {s.label}
                  </span>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--gray-500)", marginTop: "2px" }}>
                    {s.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {/* Confirmação e execução */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              paddingTop: "20px",
              borderTop: "1px solid var(--gray-100)",
            }}
          >
            {confirming && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "13px", fontWeight: 600 }}>
                <AlertTriangle size={15} strokeWidth={2.5} />
                Tem certeza? Esta ação é irreversível.
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
              {confirming && (
                <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                  Cancelar
                </Button>
              )}
              <Button
                type="button"
                onClick={handleReset}
                loading={busy}
                style={
                  confirming
                    ? { backgroundColor: "#dc2626", borderColor: "#dc2626" }
                    : { backgroundColor: "#dc2626", borderColor: "#dc2626" }
                }
              >
                {busy ? undefined : <Trash2 size={15} />}
                {confirming ? "Confirmar exclusão" : "Zerar dados"}
              </Button>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#dc2626",
              }}
              role="alert"
            >
              {error}
            </div>
          )}
          {result && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#15803d",
              }}
            >
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
