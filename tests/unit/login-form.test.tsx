import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/auth/login-form";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockGetSession = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh
  })
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      getSession: mockGetSession
    }
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
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true
    });
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockSignInWithPassword.mockReset();
    mockGetSession.mockReset();
  });

  it("redirects with App Router after successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "admin@aya.local" }
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), {
      target: { value: "password123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /الدخول إلى بيئة التشغيل/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "admin@aya.local",
        password: "password123"
      });
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/pos");
      expect(mockRefresh).toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole("button", { name: /الدخول إلى بيئة التشغيل/i }));

    expect(await screen.findByText("تعذر تسجيل الدخول")).toBeInTheDocument();
    expect(screen.getByText("Bad credentials")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  }, 15000);

  it("keeps the submit action available when the browser reports offline", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false
    });

    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });

    render(<LoginForm />);

    expect(screen.getByText("الاتصال غير متاح")).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /الدخول إلى بيئة التشغيل/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "admin@aya.local" }
    });
    fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, {
      target: { value: "password123" }
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "admin@aya.local",
        password: "password123"
      });
      expect(mockReplace).toHaveBeenCalledWith("/pos");
    });
  }, 15000);
});
