const SIZE_COLORS: Record<string, string> = {
  "PP": "#8b5cf6",
  "P": "#059669",
  "M": "#0284c7",
  "G": "#f59e0b",
  "GG": "#ef4444",
  "XG": "#06b6d4",
  "XGG": "#84cc16",
  "XXG": "#f97316",
  "2G": "#ec4899",
  "3G": "#6366f1",
  "Único": "#64748b",
  "33": "#8b5cf6",
  "34": "#059669",
  "35": "#0284c7",
  "36": "#f59e0b",
  "37": "#ef4444",
  "38": "#06b6d4",
  "39": "#84cc16",
  "40": "#f97316",
  "41": "#ec4899",
  "42": "#6366f1",
  "43": "#0d9488",
  "44": "#d946ef",
  "45": "#0ea5e9",
  "46": "#e11d48",
};

const FALLBACK_PALETTE = [
  "#059669", "#0284c7", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1",
];

let fallbackIdx = 0;

export function getSizeColor(label: string): string {
  const key = label.toUpperCase();
  if (SIZE_COLORS[key]) return SIZE_COLORS[key];
  const color = FALLBACK_PALETTE[fallbackIdx % FALLBACK_PALETTE.length];
  fallbackIdx++;
  return color;
}
