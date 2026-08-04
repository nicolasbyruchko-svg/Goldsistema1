export interface StandardizedItem {
  name: string;
  sku: string;
  type: "EPI" | "UNIFORM";
  size?: string;
  caNumber?: string;
}

export const STANDARDIZED_ITEMS: StandardizedItem[] = [
  // EPIs
  { name: "Capacete de Segurança", sku: "EPI-CAP-001", type: "EPI", caNumber: "12345" },
  { name: "Óculos de Proteção", sku: "EPI-OCU-001", type: "EPI", caNumber: "12346" },
  { name: "Protetor Auricular", sku: "EPI-PRO-001", type: "EPI", caNumber: "12347" },
  { name: "Luva de Vaqueta", sku: "EPI-LUV-001", type: "EPI", caNumber: "12348" },
  { name: "Luva de Nitrílica", sku: "EPI-LUV-002", type: "EPI", caNumber: "12349" },
  { name: "Calçado de Segurança", sku: "EPI-CAL-001", type: "EPI", caNumber: "12350" },
  { name: "Cinto Paraquedista", sku: "EPI-CIN-001", type: "EPI", caNumber: "12351" },
  { name: "Máscara PFF2", sku: "EPI-MAS-001", type: "EPI", caNumber: "12352" },
  { name: "Avental de Raspa", sku: "EPI-AVE-001", type: "EPI", caNumber: "12353" },
  { name: "Protetor Facial", sku: "EPI-PRO-002", type: "EPI", caNumber: "12354" },

  // Uniformes
  { name: "Camisa Polo", sku: "UNI-CAM-001", type: "UNIFORM" },
  { name: "Calça Jeans", sku: "UNI-CAL-001", type: "UNIFORM" },
  { name: "Camisa Social", sku: "UNI-CAM-002", type: "UNIFORM" },
  { name: "Polo de Segurança", sku: "UNI-CAM-003", type: "UNIFORM" },
  { name: "Calça de Segurança", sku: "UNI-CAL-002", type: "UNIFORM" },
  { name: "Jaqueta de Segurança", sku: "UNI-JAQ-001", type: "UNIFORM" },
  { name: "Macacão de Segurança", sku: "UNI-MAC-001", type: "UNIFORM" },
  { name: "Bota de Segurança", sku: "UNI-BOT-001", type: "UNIFORM" },
  { name: "Touca de Segurança", sku: "UNI-TOU-001", type: "UNIFORM" },
  { name: "Avental de Segurança", sku: "UNI-AVE-001", type: "UNIFORM" },
];

export function generateUniqueSku(baseSku: string, existingSkus: string[]): string {
  let sku = baseSku;
  let counter = 1;
  while (existingSkus.includes(sku)) {
    counter++;
    sku = `${baseSku.slice(0, -3)}${String(counter).padStart(3, "0")}`;
  }
  return sku;
}
