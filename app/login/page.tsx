import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso ao sistema GoldService.",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return <LoginForm />;
}
