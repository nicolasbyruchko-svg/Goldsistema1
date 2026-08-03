import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

/**
 * Next.js 16: o arquivo proxy.ts substitui o antigo middleware.ts.
 * A função exportada deve se chamar "proxy" (ou ser default export).
 */
export async function proxy(request: NextRequest) {
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
