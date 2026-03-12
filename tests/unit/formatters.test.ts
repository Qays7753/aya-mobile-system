import { formatCompactNumber, formatCurrency, formatDate, formatDateTime } from "@/lib/utils/formatters";

describe("formatters", () => {
  it("formats currency using the configured locale", () => {
    expect(formatCurrency(12.345)).toBe(
      new Intl.NumberFormat("ar-JO", {
        style: "currency",
        currency: "JOD",
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(12.345)
    );
  });

  it("formats compact numbers using the configured locale", () => {
    expect(formatCompactNumber(1234)).toBe(
      new Intl.NumberFormat("ar-JO", {
        maximumFractionDigits: 0
      }).format(1234)
    );
  });

  it("formats dates using the configured locale", () => {
    const value = "2026-03-12T10:30:00Z";
    expect(formatDate(value)).toBe(
      new Intl.DateTimeFormat("ar-JO", {
        dateStyle: "medium"
      }).format(new Date(value))
    );
  });

  it("formats date-times using the configured locale", () => {
    const value = "2026-03-12T10:30:00Z";
    expect(formatDateTime(value)).toBe(
      new Intl.DateTimeFormat("ar-JO", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    );
  });
});
