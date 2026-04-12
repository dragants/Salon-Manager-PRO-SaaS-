export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="main-content"
      className="flex min-h-dvh flex-1 items-center justify-center bg-[#f8fafc] bg-gradient-to-b from-sky-50/60 to-[#f8fafc] px-4 py-12 dark:from-slate-900 dark:to-slate-950"
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
