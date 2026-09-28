import Image from "next/image";
import {
  Backpack,
  CalendarClock,
  Clock,
  DoorOpen,
  Landmark,
  Map as MapIcon,
  Package,
  Phone,
  PlaneTakeoff,
  ShieldCheck,
  Utensils,
  Wallet,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { RideRequestForm } from "@/components/ride-request-form";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { BROTHERS, BUSINESS } from "@/lib/config";
import { formatPhone, telLink, whatsappLink } from "@/lib/links";

const SERVICES = [
  {
    icon: PlaneTakeoff,
    title: "Traslados al aeropuerto",
    text: "Newark, JFK, LaGuardia. Pasamos por ti con tiempo, no con el reloj encima.",
  },
  {
    icon: DoorOpen,
    title: "Puerta a puerta",
    text: "Te recogemos en tu casa y te dejamos en la puerta de donde vas.",
  },
  {
    icon: MapIcon,
    title: "Viajes a otros estados",
    text: "Nueva York, Pensilvania, Florida, Texas. Si está en Estados Unidos, vamos.",
  },
  {
    icon: Package,
    title: "Delivery",
    text: "Paquetes, encargos y cosas que no caben en tu carro.",
  },
  {
    icon: Backpack,
    title: "Servicio estudiantil",
    text: "Ida y vuelta a la escuela con horario fijo. Los papás saben quién maneja.",
  },
  {
    icon: Landmark,
    title: "City tours",
    text: "Un día en Nueva York o por la costa de Jersey, a tu ritmo.",
  },
  {
    icon: CalendarClock,
    title: "Reservas anticipadas",
    text: "¿Tu vuelo sale el sábado a las 5 a.m.? Apártalo desde hoy y listo.",
  },
];

const FACTS = [
  { icon: Clock, big: "24/7", small: "A cualquier hora" },
  { icon: ShieldCheck, big: "4", small: "Choferes con licencia" },
  { icon: MapIcon, big: "USA", small: "Cualquier estado" },
  { icon: Wallet, big: "$", small: "Efectivo o transferencia" },
];

const STEPS = [
  {
    title: "Comparte tu ubicación",
    text: "Un toque y el GPS de tu teléfono nos dice dónde estás. No tienes que explicar cómo llegar.",
  },
  {
    title: "Un hermano acepta",
    text: "El pedido le llega a los cuatro al mismo tiempo. El primero que esté libre lo toma.",
  },
  {
    title: "Te escribe y sale por ti",
    text: "Te confirma por WhatsApp la hora y el precio, y abre la ruta directo a tu puerta.",
  },
];

export default function Home() {
  const mainWa = whatsappLink(BUSINESS.mainPhone, "Hola, quiero pedir un viaje.");

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ambar focus:px-4 focus:py-2 focus:text-noche"
      >
        Saltar al contenido
      </a>
      <SiteHeader />

      <main id="contenido">
        {/* HERO */}
        <section className="grano relative overflow-hidden bg-noche text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-ambar/10 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-20 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:pt-20 md:pb-28">
            <div className="animate-entrar">
              <p className="font-display mb-5 inline-flex items-center gap-2 rounded-sm bg-white/10 px-3 py-1 text-sm font-semibold tracking-[0.18em] text-ambar uppercase">
                Asbury Park, NJ · Servicio 24/7
              </p>
              <h1 className="font-display text-[3.4rem] leading-[0.9] font-extrabold uppercase sm:text-7xl lg:text-[5.5rem]">
                Te llevamos
                <br />
                <span className="text-ambar">a donde vayas.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-niebla sm:text-xl">
                Somos cuatro hermanos con camionetas propias. Salimos de Asbury Park al aeropuerto, a tu trabajo o a
                otro estado. Tú pones el destino.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#pedir"
                  className="font-display inline-flex h-14 items-center justify-center rounded-md bg-ambar px-8 text-xl font-extrabold tracking-wide text-noche uppercase shadow-[0_5px_0_#b9861a] transition-colors hover:bg-ambar-claro"
                >
                  Pedir viaje
                </a>
                <a
                  href={mainWa}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display inline-flex h-14 items-center justify-center gap-2 rounded-md border-2 border-white/25 px-6 text-lg font-bold tracking-wide uppercase transition-colors hover:border-wa hover:text-wa"
                >
                  <WhatsAppIcon /> Escribir por WhatsApp
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm md:max-w-none">
              <div aria-hidden="true" className="absolute inset-x-[12%] bottom-0 h-16 rounded-full bg-black/50 blur-2xl" />
              <Image
                src="/images/logo.webp"
                alt="Logo de Transportes Hermanos Ordaz: una minivan en la carretera con la bandera de New Jersey y la Estatua de la Libertad"
                width={648}
                height={650}
                priority
                sizes="(min-width: 768px) 40vw, 80vw"
                className="relative z-10 w-full md:rotate-3"
              />
            </div>
          </div>

          {/* Datos rápidos */}
          <div className="relative border-t border-white/10 bg-noche-2/70">
            <ul className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
              {FACTS.map((f, i) => (
                <li
                  key={f.small}
                  className={`flex items-center gap-3 py-5 ${i % 2 === 1 ? "pl-4 md:pl-6" : ""} ${
                    i > 0 ? "md:border-l md:border-white/10 md:pl-6" : ""
                  }`}
                >
                  <f.icon className="size-6 shrink-0 text-ambar" aria-hidden="true" />
                  <div>
                    <p className="font-display text-2xl leading-none font-extrabold">{f.big}</p>
                    <p className="text-sm text-niebla">{f.small}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" aria-labelledby="servicios-titulo" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
            <div className="md:sticky md:top-28 md:self-start">
              <p className="font-display text-sm font-bold tracking-[0.2em] text-gris uppercase">Servicios</p>
              <h2 id="servicios-titulo" className="font-display mt-2 text-5xl leading-[0.95] font-extrabold uppercase sm:text-6xl">
                Lo que
                <br />
                hacemos
              </h2>
              <div className="raya-h mt-6 w-32" aria-hidden="true" />
              <p className="mt-6 max-w-sm text-lg text-gris">
                Viajes cortos, largos y los que nadie más quiere hacer a las 4 de la mañana.
              </p>
            </div>

            <ol className="divide-y divide-noche/10 border-y border-noche/10">
              {SERVICES.map((s, i) => (
                <li key={s.title} className="group grid grid-cols-[auto_1fr] items-start gap-x-5 py-6">
                  <span className="font-display flex size-12 items-center justify-center rounded-md bg-noche text-ambar transition-colors group-hover:bg-ambar group-hover:text-noche">
                    <s.icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display flex items-baseline gap-3 text-2xl font-bold uppercase">
                      <span className="text-sm text-gris tabular-nums" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.title}
                    </h3>
                    <p className="mt-1 text-gris">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* VIAJES LARGOS */}
        <section
          id="viajes-largos"
          aria-labelledby="largos-titulo"
          className="grano relative overflow-hidden bg-noche text-white"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
            <div className="relative order-2 md:order-1">
              <div className="absolute -inset-3 -rotate-2 rounded-lg bg-rojo/80" aria-hidden="true" />
              <Image
                src="/images/explorer-noche.webp"
                alt="Camioneta roja de la empresa frente al skyline de Nueva York de noche"
                width={592}
                height={440}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="relative w-full rounded-md"
              />
            </div>
            <div className="order-1 md:order-2">
              <p className="font-display text-sm font-bold tracking-[0.2em] text-ambar uppercase">Viajes largos</p>
              <h2 id="largos-titulo" className="font-display mt-2 text-5xl leading-[0.95] font-extrabold uppercase sm:text-6xl">
                ¿Otro estado?
                <br />
                Salimos todos los días.
              </h2>
              <ul className="mt-8 space-y-4 text-lg">
                <li className="flex gap-3">
                  <Wallet className="mt-1 size-5 shrink-0 text-ambar" aria-hidden="true" />
                  <span>
                    <strong className="text-white">Pagas al llegar.</strong>{" "}
                    <span className="text-niebla">Nada por adelantado.</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <Utensils className="mt-1 size-5 shrink-0 text-ambar" aria-hidden="true" />
                  <span>
                    <strong className="text-white">Comida incluida</strong>{" "}
                    <span className="text-niebla">en el camino.</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <DoorOpen className="mt-1 size-5 shrink-0 text-ambar" aria-hidden="true" />
                  <span>
                    <strong className="text-white">De tu puerta a su puerta,</strong>{" "}
                    <span className="text-niebla">con todo y maletas.</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-1 size-5 shrink-0 text-ambar" aria-hidden="true" />
                  <span>
                    <strong className="text-white">Choferes con licencia</strong>{" "}
                    <span className="text-niebla">que ya se saben las rutas.</span>
                  </span>
                </li>
              </ul>
              <a
                href="#pedir"
                className="font-display mt-10 inline-flex h-14 items-center rounded-md bg-ambar px-7 text-lg font-extrabold tracking-wide text-noche uppercase transition-colors hover:bg-ambar-claro"
              >
                Cotizar mi viaje
              </a>
            </div>
          </div>
        </section>

        {/* PEDIR VIAJE */}
        <section id="pedir" aria-labelledby="pedir-titulo" className="bg-arena">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-28">
            <div>
              <p className="font-display text-sm font-bold tracking-[0.2em] text-gris uppercase">Cómo pedir</p>
              <h2 id="pedir-titulo" className="font-display mt-2 text-5xl leading-[0.95] font-extrabold uppercase sm:text-6xl">
                Pide tu viaje
                <br />
                en un minuto
              </h2>

              <div className="relative mt-10">
              <div className="raya-v absolute top-2 bottom-2 left-[14px]" aria-hidden="true" />
              <ol className="space-y-10 pl-12">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="relative">
                    <span
                      className="font-display absolute top-0 -left-12 flex size-8 items-center justify-center rounded-full bg-noche text-lg font-bold text-ambar ring-4 ring-arena"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <h3 className="font-display text-2xl font-bold uppercase">{s.title}</h3>
                    <p className="mt-1 text-gris">{s.text}</p>
                  </li>
                ))}
              </ol>
              </div>

              <p className="mt-10 text-gris">
                ¿Prefieres hablar? Llama al{" "}
                <a href={telLink(BUSINESS.mainPhone)} className="font-semibold whitespace-nowrap text-tinta underline underline-offset-2">
                  {formatPhone(BUSINESS.mainPhone)}
                </a>
                .
              </p>
            </div>

            <div className="rounded-xl bg-crema p-5 shadow-[0_1px_0_rgba(11,27,51,0.08),0_20px_50px_-20px_rgba(11,27,51,0.35)] sm:p-8">
              <RideRequestForm />
            </div>
          </div>
        </section>

        {/* LOS HERMANOS */}
        <section id="hermanos" aria-labelledby="hermanos-titulo" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <div className="grid items-end gap-8 md:grid-cols-2">
            <div>
              <p className="font-display text-sm font-bold tracking-[0.2em] text-gris uppercase">Los choferes</p>
              <h2 id="hermanos-titulo" className="font-display mt-2 text-5xl leading-[0.95] font-extrabold uppercase sm:text-6xl">
                Los hermanos Ordaz
              </h2>
              <p className="mt-5 max-w-md text-lg text-gris">
                Aquí no hay centro de llamadas. Contesta el mismo que te va a manejar. Guarda el número que quieras,
                todos tienen WhatsApp.
              </p>
            </div>
            <Image
              src="/images/chofer-rav4.webp"
              alt="Chofer de uniforme junto a una camioneta blanca rotulada con el nombre de la empresa"
              width={1010}
              height={520}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full rounded-lg"
            />
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {BROTHERS.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-noche/10 bg-white p-5">
                <span
                  className="font-display flex size-14 shrink-0 items-center justify-center rounded-full bg-noche text-2xl font-extrabold text-ambar"
                  aria-hidden="true"
                >
                  {b.id}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-2xl font-bold uppercase">{b.name}</h3>
                  <p className="text-gris tabular-nums">{formatPhone(b.phone)}</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <a
                    href={whatsappLink(b.phone, "Hola, quiero pedir un viaje.")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-wa px-4 font-semibold text-noche sm:flex-none"
                  >
                    <WhatsAppIcon /> WhatsApp
                  </a>
                  <a
                    href={telLink(b.phone)}
                    aria-label={`Llamar a ${b.name}`}
                    className="inline-flex size-12 items-center justify-center rounded-md border border-noche/20 text-tinta hover:bg-noche hover:text-white"
                  >
                    <Phone className="size-5" aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="bg-noche text-white">
        <div className="raya-h w-full opacity-60" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div className="flex items-center gap-4">
            <Image src="/images/logo.webp" alt="" width={72} height={72} className="size-18" />
            <div>
              <p className="font-display text-xl font-bold uppercase">{BUSINESS.name}</p>
              <p className="text-sm text-niebla">Asbury Park, New Jersey</p>
            </div>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold tracking-[0.2em] text-ambar uppercase">Teléfonos</h2>
            <ul className="mt-3 space-y-1 text-niebla tabular-nums">
              {BROTHERS.map((b) => (
                <li key={b.id}>
                  <a href={telLink(b.phone)} className="hover:text-white">
                    {formatPhone(b.phone)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold tracking-[0.2em] text-ambar uppercase">Pagos</h2>
            <p className="mt-3 text-niebla">Efectivo o transferencia. En viajes largos pagas al llegar.</p>
            {/* TODO: agregar links de Facebook y TikTok cuando nos pasen las URLs */}
            <a href="/choferes" className="mt-6 inline-block text-sm text-niebla underline underline-offset-4 hover:text-white">
              Acceso choferes
            </a>
          </div>
        </div>
        <p className="border-t border-white/10 py-5 text-center text-sm text-niebla">
          © {new Date().getFullYear()} {BUSINESS.name} · Built with Claude Web Builder by{" "}
          <a href="https://tododeia.com" className="underline underline-offset-2 hover:text-white">
            Tododeia
          </a>
        </p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TaxiService",
            name: BUSINESS.name,
            areaServed: "US",
            telephone: `+1${BUSINESS.mainPhone}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Asbury Park",
              addressRegion: "NJ",
              addressCountry: "US",
            },
          }),
        }}
      />
    </>
  );
}
