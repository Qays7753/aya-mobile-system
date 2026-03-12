import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DashboardError from "@/app/(dashboard)/error";

describe("DashboardError", () => {
  it("shows a persistent error state without leaking the raw error", () => {
    const reset = vi.fn();

    render(<DashboardError error={new Error("should not leak") as Error & { digest?: string }} reset={reset} />);

    expect(screen.getByRole("heading", { name: "تعذر تحميل مساحة التشغيل" })).toBeInTheDocument();
    expect(
      screen.getByText("حدث خطأ غير متوقع أثناء تحميل الشاشة الحالية. حاول مجددًا.")
    ).toBeInTheDocument();
    expect(screen.queryByText("should not leak")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(reset).toHaveBeenCalledTimes(1);
  }, 20000);
});
