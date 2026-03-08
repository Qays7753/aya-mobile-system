export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-JO", {
    style: "currency",
    currency: "JOD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("ar-JO", {
    maximumFractionDigits: 0
  }).format(value);
}
