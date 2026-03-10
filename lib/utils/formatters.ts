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

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
