export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="main-content"
      className="flex min-h-dvh min-w-0 flex-1 flex-col bg-[#f8fafc] dark:bg-slate-950"
    >
      {children}
    </div>
  );
}
