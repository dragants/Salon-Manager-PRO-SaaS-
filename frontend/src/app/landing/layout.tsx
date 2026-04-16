import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salon Manager PRO — lepota, masaža, online rezervacije",
  description:
    "Za salone lepote i wellness: kalendar, klijenti, podsetnici i javni link za zakazivanje. Isprobajte besplatno.",
  openGraph: {
    title: "Salon Manager PRO",
    description:
      "Kalendar, klijenti, podsetnici i online rezervacije za salone lepote i wellness.",
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
