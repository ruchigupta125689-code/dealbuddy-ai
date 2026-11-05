export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-dvh flex-1 flex-col">{children}</main>;
}
