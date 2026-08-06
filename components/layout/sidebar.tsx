"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Package,
  ClipboardList,
  ReceiptText,
  BarChart3,
  Undo2,
  DatabaseZap,
  ShieldCheck,
  LogOut,
  UserRound,
  Menu,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import type { SessionUser } from "@/lib/auth";

const ALL_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    label: "Contratos",
    href: "/projects",
    icon: FolderKanban,
    adminOnly: false,
  },
  {
    label: "Trabalhadores",
    href: "/workers",
    icon: Users,
    adminOnly: false,
  },
  {
    label: "Estoque",
    href: "/stock",
    icon: Package,
    adminOnly: false,
  },
  {
    label: "Compras",
    href: "/purchases",
    icon: ReceiptText,
    adminOnly: false,
  },
  {
    label: "Entregas",
    href: "/deliveries",
    icon: ClipboardList,
    adminOnly: false,
  },
  {
    label: "Devoluções",
    href: "/devolutions",
    icon: Undo2,
    adminOnly: false,
  },
  {
    label: "Relatórios",
    href: "/reports",
    icon: BarChart3,
    adminOnly: false,
  },
  {
    label: "Usuários",
    href: "/admin/users",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

export function Sidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logoutAction();
  };

  return (
    <>
      {/* Botão de menu (mobile) */}
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: isMobile ? "flex" : "none",
          position: "fixed",
          top: "14px",
          right: "14px",
          zIndex: 70,
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--navy-900)",
          color: "#ffffff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay (mobile) */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 45,
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      <aside
        style={{
          width: "var(--sidebar-width)",
          backgroundColor: "var(--navy-900)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
          transform: isMobile
            ? open
              ? "translateX(0)"
              : "translateX(-100%)"
            : "translateX(0)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "28px 24px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Image
            src="/oroepi-logo.png"
            alt="GoldService"
            width={312}
            height={62}
            priority
            style={{ width: "100%", maxWidth: "190px", height: "auto", display: "block" }}
          />
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              padding: "8px 12px 4px",
            }}
          >
            Menu Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.12)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--yellow-primary)"
                    : "3px solid transparent",
                  transition:
                    "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(255,255,255,0.6)";
                  }
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    color: isActive
                      ? "var(--yellow-primary)"
                      : "rgba(255,255,255,0.5)",
                    flexShrink: 0,
                  }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "16px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Usuário logado */}
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.06)",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "var(--yellow-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <UserRound size={17} style={{ color: "var(--navy-900)" }} strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: "11px",
                    color: "var(--yellow-primary)",
                  }}
                >
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            </div>
          )}

          {isAdmin && (
            <Link
              href="/admin/reset"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.55)",
                transition: "background-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <DatabaseZap
                size={16}
                style={{ color: "#f87171", flexShrink: 0 }}
                strokeWidth={2}
              />
              <span>Zerar dados</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "none",
              background: "none",
              cursor: loggingOut ? "wait" : "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              transition: "background-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            }}
          >
            <LogOut size={16} style={{ color: "rgba(255,255,255,0.55)", flexShrink: 0 }} strokeWidth={2} />
            <span>Sair</span>
          </button>

          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              margin: "12px 0 0",
            }}
          >
            Desenvolvido por: Nicolas Byruchko
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
              textAlign: "center",
              margin: "4px 0 0",
            }}
          >
            © 2026 GoldService v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
