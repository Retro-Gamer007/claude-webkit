import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de choferes",
  robots: { index: false, follow: false },
  manifest: "/choferes.webmanifest",
  appleWebApp: { capable: true, title: "Ordaz Choferes", statusBarStyle: "black-translucent" },
};

export default function ChoferesLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-noche text-white">{children}</div>;
}
