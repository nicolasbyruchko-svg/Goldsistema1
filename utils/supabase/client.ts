import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Supabase client para uso em Client Components ("use client").
 * Reutiliza a mesma instância durante o ciclo de vida do componente.
 */
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
