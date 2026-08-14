/**
 * Formata CPF: "12345678900" → "123.456.789-00"
 * Aceita string com ou sem formatação.
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
}

/** Remove tudo que não for dígito */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata data para exibição: "28/07/2026" */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(date)
  );
}

/** Formata data e hora: "28/07/2026 às 09:30" */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Label legível para o motivo da entrega */
export function formatReason(
  reason: "FIRST_DELIVERY" | "REPLACEMENT_WEAR" | "REPLACEMENT_LOSS" | "RETURN_TO_WORK" | "SIZE_EXCHANGE" | string
): string {
  const map: Record<string, string> = {
    FIRST_DELIVERY: "Primeira Entrega",
    REPLACEMENT_WEAR: "Reposição por Desgaste",
    REPLACEMENT_LOSS: "Reposição por Perda/Extravio",
    RETURN_TO_WORK: "Retorno ao trabalho",
    SIZE_EXCHANGE: "Troca por tamanho",
  };
  return map[reason] ?? reason;
}

/** Label legível para o status da entrega */
export function formatDeliveryStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING_SIGNATURE: "Aguardando Assinatura",
    SIGNED: "Assinado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

/** Formata valor monetário em BRL: 1234.5 → "R$ 1.234,50" */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/** Formata número com separador pt-BR: 1234.5 → "1.234,5" */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Converte Decimal do Prisma (ou string) para number, ou null se vazio.
 * Necessário porque objetos Decimal não atravessam a fronteira
 * Server Component → Client Component (React só serializa plain objects).
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}
