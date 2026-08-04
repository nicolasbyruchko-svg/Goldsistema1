/**
 * Tipos "serializáveis" para cruzar a fronteira Server → Client Component.
 *
 * O Prisma retorna `Decimal` para campos decimais (unitCost, totalValue), e o
 * React não serializa objetos `Decimal` de Server para Client Components.
 * As actions normalizam esses campos para `number` (ver lib/utils.ts toNumber)
 * e devolvem estes tipos; os componentes client usam estes tipos nas props.
 */
export type SerializableProduct = {
  id: string;
  name: string;
  sku: string;
  type: string;
  condition: string;
  size: string | null;
  caNumber: string | null;
  caValidity: Date | null;
  unitCost: number | null;
  supplier: string | null;
  stockQuantity: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
};
