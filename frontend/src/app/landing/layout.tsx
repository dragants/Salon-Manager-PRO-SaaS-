import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salon Manager PRO — kalendar, klijenti, online rezervacije",
  description:
    "Upravljajte salonima bez haosa: kalendar, CRM, podsetnici i javni link za zakazivanje. Isprobajte besplatno.",
  openGraph: {
    title: "Salon Manager PRO",
    description:
      "Kalendar, klijenti, automatski podsetnici i online rezervacije za salone.",
    type: "website",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
