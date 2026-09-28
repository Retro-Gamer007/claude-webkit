"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "#servicios", label: "Servicios" },
  { href: "#viajes-largos", label: "Viajes largos" },
  { href: "#hermanos", label: "Los hermanos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-noche/95 text-white backdrop-blur supports-[backdrop-filter]:bg-noche/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="Transportes Hermanos Ordaz, inicio">
          <Image src="/images/logo.webp" alt="" width={44} height={44} className="size-11" priority />
          <span className="font-display text-lg leading-none font-bold tracking-wide uppercase">
            Hermanos <span className="text-ambar">Ordaz</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-niebla transition-colors hover:text-white">
              {n.label}
            </a>
          ))}
          <a
            href="#pedir"
            className="font-display inline-flex h-11 items-center rounded-md bg-ambar px-5 text-base font-bold tracking-wide text-noche uppercase transition-colors hover:bg-ambar-claro"
          >
            Pedir viaje
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-white md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="menu-movil"
          aria-label="Menú móvil"
          className="animate-entrar fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-1 bg-noche px-4 pt-6 md:hidden"
        >
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="font-display border-b border-white/10 py-4 text-3xl font-bold uppercase"
            >
              {n.label}
            </a>
          ))}
          <a
            href="#pedir"
            onClick={() => setOpen(false)}
            className="font-display mt-6 inline-flex h-14 items-center justify-center rounded-md bg-ambar text-xl font-bold text-noche uppercase"
          >
            Pedir viaje
          </a>
        </nav>
      )}
    </header>
  );
}
