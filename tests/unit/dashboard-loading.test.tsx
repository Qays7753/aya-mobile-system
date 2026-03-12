import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardLoading from "@/app/(dashboard)/loading";

describe("DashboardLoading", () => {
  it("renders a non-blank loading shell with skeleton content", () => {
    const { container } = render(<DashboardLoading />);

    expect(container.querySelector(".dashboard-loading")).toBeTruthy();
    expect(container.querySelectorAll(".skeleton-line").length).toBeGreaterThanOrEqual(5);
    expect(container.querySelectorAll(".skeleton-card").length).toBe(3);
    expect(screen.getByRole("main")).toBeInTheDocument();
  }, 20000);
});
