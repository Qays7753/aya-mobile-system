import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

describe("ConfirmationDialog", () => {
  it("stays hidden when closed", () => {
    const { container } = render(
      <ConfirmationDialog
        open={false}
        title="تأكيد"
        description="وصف"
        confirmLabel="متابعة"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("requires explicit confirmation before running the action", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationDialog
        open
        title="إلغاء الفاتورة"
        description="سيتم إلغاء الفاتورة الحالية."
        confirmLabel="تأكيد الإلغاء"
        onConfirm={onConfirm}
        onCancel={onCancel}
        tone="danger"
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("سيتم إلغاء الفاتورة الحالية.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الإلغاء" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  }, 15000);
});
