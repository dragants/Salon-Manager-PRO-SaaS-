import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

// Minimal mocks for Next app router hooks used in the page.
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      replace: vi.fn(),
      refresh: vi.fn(),
    };
  },
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth() {
    return {
      user: null,
      loading: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Login page", () => {
  it("renders form fields", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lozinka/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prijavi se/i })).toBeInTheDocument();
  });

  it("shows error when server is unreachable", async () => {
    const { api } = await import("@/lib/api/client");
    vi.spyOn(api, "post").mockRejectedValueOnce({
      isAxiosError: true,
      response: undefined,
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/lozinka/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /prijavi se/i }));

    expect(
      await screen.findByText(/Nema veze sa serverom/i)
    ).toBeInTheDocument();
  });
});

