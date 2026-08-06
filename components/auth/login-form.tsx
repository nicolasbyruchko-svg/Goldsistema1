"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, LogIn, User } from "lucide-react";
import { login } from "@/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Informe usuário e senha.");
      return;
    }
    setBusy(true);
    setError(undefined);
    const res = await login(username, password);
    setBusy(false);
    if (res) setError(res.error);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--navy-900)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow decorativo */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-120px",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,217,61,0.12)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-140px",
          left: "-140px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          backgroundColor: "rgba(25,55,109,0.9)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <form
        onSubmit={handleSubmit}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          padding: "36px 32px 32px",
          animation: "fadeIn 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <Image
            src="/oroepi-logo.png"
            alt="GoldService"
            width={312}
            height={62}
            priority
            style={{ maxWidth: "220px", width: "100%", height: "auto" }}
          />
        </div>

        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--navy-900)",
            textAlign: "center",
            margin: "0 0 4px",
            letterSpacing: "-0.4px",
          }}
        >
          Acessar o sistema
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--gray-500)",
            textAlign: "center",
            margin: "0 0 24px",
          }}
        >
          Informe seu login e senha para continuar.
        </p>

        <div style={{ marginBottom: "16px" }}>
          <Label htmlFor="username" required>
            Usuário
          </Label>
          <div style={{ position: "relative" }}>
            <User
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--gray-400)",
                pointerEvents: "none",
              }}
            />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              style={{ paddingLeft: "36px" }}
              autoFocus
            />
          </div>
        </div>

        <div style={{ marginBottom: "6px" }}>
          <Label htmlFor="password" required>
            Senha
          </Label>
          <div style={{ position: "relative" }}>
            <Lock
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--gray-400)",
                pointerEvents: "none",
              }}
            />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingLeft: "36px" }}
            />
          </div>
        </div>

        <FieldError message={error} />

        <div style={{ marginTop: "20px" }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={busy}
            style={{ width: "100%" }}
          >
            {busy ? undefined : <LogIn size={17} />}
            Entrar
          </Button>
        </div>
      </form>
    </div>
  );
}
