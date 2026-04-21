import type { Metadata } from "next";

function serverApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  return "http://127.0.0.1:5000";
}

type PublicSalonJson = {
  salon?: { name?: string; address?: string | null };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) {
    return { title: "Online rezervacija" };
  }
  const base = serverApiBase();
  try {
    const r = await fetch(`${base}/public/${encodeURIComponent(slug)}`, {
      next: { revalidate: 120 },
    });
    if (!r.ok) {
      return {
        title: "Rezervacija · Salon Manager PRO",
        robots: { index: false, follow: false },
      };
    }
    const data = (await r.json()) as PublicSalonJson;
    const name = data.salon?.name?.trim() || "Salon";
    const address = data.salon?.address?.trim();
    const desc = address
      ? `Zakažite termin u salonu ${name} — ${address}.`
      : `Zakažite termin u salonu ${name}. Online, bez poziva.`;
    return {
      title: `${name} · Rezervacija`,
      description: desc,
      openGraph: {
        title: `${name} · Online rezervacija`,
        description: desc,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} · Rezervacija`,
        description: desc,
      },
    };
  } catch {
    return { title: "Online rezervacija · Salon Manager PRO" };
  }
}

export default function BookSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
