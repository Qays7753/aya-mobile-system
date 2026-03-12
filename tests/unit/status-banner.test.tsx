import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StatusBanner } from "@/components/ui/status-banner";

describe("StatusBanner", () => {
  it("renders message, retry action, and dismiss affordance", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();

    render(
      <StatusBanner
        title="فشل الاتصال"
        message="تعذر تحميل البيانات الحالية."
        variant="danger"
        actionLabel="إعادة المحاولة"
        onAction={onAction}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("فشل الاتصال")).toBeInTheDocument();
    expect(screen.getByText("تعذر تحميل البيانات الحالية.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    fireEvent.click(screen.getByRole("button", { name: "إخفاء الرسالة" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  }, 15000);
});
