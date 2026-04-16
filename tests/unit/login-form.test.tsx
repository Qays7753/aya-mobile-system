import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/auth/login-form";

const { mockFrom, mockRouterRefresh, mockRouterReplace, mockSignInWithPassword } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRouterRefresh: vi.fn(),
  mockRouterReplace: vi.fn(),
  mockSignInWithPassword: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    refresh: mockRouterRefresh
  })
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword
    },
    from: mockFrom
  })
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true
    });
    window.localStorage.clear();
    mockFrom.mockReset();
    mockRouterRefresh.mockReset();
    mockRouterReplace.mockReset();
    mockSignInWithPassword.mockReset();
  });

  it("routes successful logins through the server-side continuation page", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "admin-1" }, session: {} },
      error: null
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "admin@aya.local" }
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), {
      target: { value: "password123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "admin@aya.local",
        password: "password123"
      });
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith("/auth/continue");
      expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
    });
  }, 15000);

  it("shows a persistent error banner when login fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Bad credentials" }
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "wrong@aya.local" }
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), {
      target: { value: "wrong-password" }
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    expect(await screen.findByText("تعذر تسجيل الدخول")).toBeInTheDocument();
    expect(screen.getByText("تعذر إكمال تسجيل الدخول. حاول مجددًا.")).toBeInTheDocument();
    expect(screen.queryByText("Bad credentials")).not.toBeInTheDocument();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  }, 15000);

  it("keeps the submit action available when the browser reports offline", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false
    });

    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "admin-1" }, session: {} },
      error: null
    });

    render(<LoginForm />);

    expect(screen.getByText("الاتصال غير متاح")).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /تسجيل الدخول/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "admin@aya.local" }
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), {
      target: { value: "password123" }
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "admin@aya.local",
        password: "password123"
      });
      expect(mockRouterReplace).toHaveBeenCalledWith("/auth/continue");
    });
  }, 15000);

  it("remembers the last successful email when the checkbox stays enabled", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "admin-1" }, session: {} },
      error: null
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "admin@aya.local" }
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), {
      target: { value: "password123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem("aya.login.email")).toBe("admin@aya.local");
      expect(mockRouterReplace).toHaveBeenCalledWith("/auth/continue");
    });
  }, 15000);

  it("releases the form lock if navigation does not complete", async () => {
    vi.useFakeTimers();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "admin-1" }, session: {} },
      error: null
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "admin@aya.local" }
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), {
      target: { value: "password123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });

    expect(mockRouterReplace).toHaveBeenCalledWith("/auth/continue");
    expect(screen.getByText("تم تسجيل الدخول لكن تعذر فتح مساحة العمل. حاول مرة أخرى.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تسجيل الدخول/i })).not.toBeDisabled();
  }, 15000);
});
