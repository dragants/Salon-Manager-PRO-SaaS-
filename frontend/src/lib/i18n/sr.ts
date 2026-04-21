/**
 * Centralni stringovi (sr) — proširuj po modulima; kasnije lako mapiranje na en/hu.
 * Za sada: landing + mobilni dock.
 */
export const sr = {
  nav: {
    dock: {
      home: "Početna",
      calendar: "Termini",
      clients: "Klijenti",
      settings: "Podeš.",
    },
  },
  landing: {
    brand: "Salon Manager PRO",
    header: {
      login: "Prijava",
      cta: "Isprobaj besplatno",
    },
    hero: {
      title: "Rešenje za bol i stres",
      subtitle: "Profesionalna masaža i kiropraktika",
      primary: "Zakaži termin",
      secondary: "Pogledaj usluge",
    },
    stats: ["500+ klijenata", "4.9 ocena", "10 godina iskustva"],
    featureBullets: [
      "Manje poziva — klijenti vide slobodne termine sami",
      "Nema propuštenih termina — podsetnici i jasna istorija",
      "Veća zarada — pratite prihod i usluge na jednom mestu",
    ],
    featureGrid: [
      { title: "Kalendar i smene", body: "Nedeljni i dnevni prikaz, smene osoblja, kolizije termina." },
      { title: "Klijenti i karton", body: "CRM, beleške, prilozi i istorija dolazaka na jednom mestu." },
      { title: "Kasa i troškovi", body: "Prihodi, rashodi, izveštaji — spremno za knjigovodstvo." },
      { title: "Online rezervacije", body: "Javna stranica salona sa linkom za samostalno zakazivanje." },
      { title: "Loyalty", body: "Pečati i nagrade — zadržite redovne klijente." },
      { title: "Podsetnici", body: "E-mail / SMS / WhatsApp prema podešavanjima salona." },
      { title: "Više lokacija", body: "Organizacija po salonu — siguran multi-tenant model." },
      { title: "Analitika", body: "Trend poslovanja, no-show i top usluge." },
    ],
    pricingTitle: "Cene",
    pricingSubtitle: "Počnite besplatno, nadogradite kad vam zatreba.",
    plans: [
      {
        name: "Besplatno",
        price: "0 RSD",
        period: "/ mesec",
        desc: "Za start ili manje salone.",
        features: ["Do limita klijenata i termina", "Kalendar i klijenti", "Javna rezervacija"],
        cta: "Registruj se",
        highlight: false,
      },
      {
        name: "Basic",
        price: "od €19",
        period: "/ mesec",
        desc: "Rastući salon, više termina.",
        features: ["Viši limiti", "SMS/WhatsApp opciono", "Prioritet podrške"],
        cta: "Izaberi Basic",
        highlight: false,
      },
      {
        name: "Pro",
        price: "od €39",
        period: "/ mesec",
        desc: "Više lokacija i timova.",
        features: ["Najviši limiti", "Napredna analitika", "Dedicated onboarding"],
        cta: "Izaberi Pro",
        highlight: true,
      },
    ],
    pricingNote:
      "Tačan iznos zavisi od Paddle cenovnika i valute. Proverite u aplikaciji nakon registracije.",
    faqTitle: "Često postavljana pitanja",
    faq: [
      {
        q: "Da li mogu da koristim aplikaciju sa telefona?",
        a: "Da. Aplikacija je responzivna; mobilni dock u donjem delu olakšava navigaciju.",
      },
      {
        q: "Gde se čuvaju podaci?",
        a: "U vašoj PostgreSQL bazi (self-host ili naš cloud). Fajlovi kartona mogu kasnije ići na S3-compatible skladište.",
      },
      {
        q: "Kako funkcioniše online rezervacija?",
        a: "Svaki salon dobija javni link /book/[slug]. Klijent bira uslugu, datum i termin bez poziva.",
      },
      {
        q: "Mogu li da otkažem pretplatu?",
        a: "Da, kroz Paddle customer portal (link u podešavanjima naplate).",
      },
    ],
    integrationsTitle: "Integracije",
    integrations: ["Paddle naplata", "PostgreSQL", "E-mail (SMTP)", "Twilio / WhatsApp opciono"],
    clientsTitle: "Naši klijenti",
    ctaBand: "Isprobajte Salon Manager PRO — 7 dana besplatno.",
    ctaPrimary: "Isprobaj 7 dana besplatno",
    ctaSecondary: "Već imam nalog",
    footer: {
      product: "Proizvod",
      legal: "Pravno",
      links: [
        { href: "/login", label: "Prijava" },
        { href: "/register", label: "Registracija" },
        { href: "/legal/privacy", label: "Privatnost" },
        { href: "/legal/terms", label: "Uslovi" },
      ],
    },
  },
} as const;
