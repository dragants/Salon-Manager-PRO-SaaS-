export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="main-content"
      className="relative z-[1] flex min-h-dvh min-w-0 flex-1 flex-col bg-background text-foreground"
    >
      {children}
    </div>
  );
}
