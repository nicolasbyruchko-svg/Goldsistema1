import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Next.js 16: o arquivo proxy.ts substitui o antigo middleware.ts.
 * A função exportada deve se chamar "proxy" (ou ser default export).
 *
 * Controla o acesso à área restrita:
 * - Sem cookie de sessão → redireciona para /login.
 * - Já logado acessando /login → redireciona para /dashboard.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/workers",
  "/stock",
  "/purchases",
  "/deliveries",
  "/devolutions",
  "/reports",
  "/admin",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/") {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } else if (isProtected(pathname) && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return createClient(request);
}

export const config = {
  matcher: [
    /*
     * Aplica o proxy em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico e arquivos com extensão (ex: .svg, .png, .jpg)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
