import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PublicBookingPage from "@/app/book/[slug]/page";

vi.mock("next/navigation", () => ({
  useParams() {
    return { slug: "demo-salon" };
  },
}));

vi.mock("@/lib/api/public-booking", () => ({
  fetchPublicSalon: vi.fn().mockResolvedValue({
    salon: {
      name: "Demo salon",
      phone: null,
      address: null,
      logo: null,
      timezone: "Europe/Belgrade",
      theme_color: null,
    },
    services: [{ id: 1, name: "Masaža", price: 2000, duration_minutes: 60 }],
    booking_notify: { public_booking_email: false },
  }),
  fetchPublicSlots: vi.fn().mockResolvedValue({
    slots: [],
    timezone: "Europe/Belgrade",
    from_shifts: false,
  }),
  postPublicBook: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Public booking flow", () => {
  it("renders booking header", async () => {
    render(<PublicBookingPage />);
    expect(await screen.findByText(/Online rezervacija/i)).toBeInTheDocument();
    expect(await screen.findByText(/Demo salon/i)).toBeInTheDocument();
  });

  it("advances from service step via 'Dalje'", async () => {
    render(<PublicBookingPage />);
    await screen.findByText(/Demo salon/i);

    // Step 1 -> Next
    const next1 = await screen.findByRole("button", { name: /dalje/i });
    fireEvent.click(next1);

    expect(await screen.findByText(/Izaberi datum/i)).toBeInTheDocument();
  });
});

