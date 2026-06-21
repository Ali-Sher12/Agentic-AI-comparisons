export const ITEM_CATEGORIES = [
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "DOCUMENTS", label: "Documents" },
  { value: "JEWELRY", label: "Jewelry" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "BAGS_WALLETS", label: "Bags & Wallets" },
  { value: "VEHICLE", label: "Vehicle / Transport" },
  { value: "KEYS", label: "Keys" },
  { value: "MONEY", label: "Money" },
  { value: "OTHER", label: "Other" },
];

export const ITEM_CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "POOR", label: "Poor" },
];

export function categoryLabel(value) {
  return ITEM_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function conditionLabel(value) {
  return ITEM_CONDITIONS.find((c) => c.value === value)?.label || value;
}

export function formatDateTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
