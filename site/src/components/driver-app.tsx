"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CalendarClock,
  Check,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Route,
  StickyNote,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { BROTHERS } from "@/lib/config";
import { formatPhone, googleMapsPin, googleMapsRoute, googleMapsTo, telLink, wazeTo, whatsappLink } from "@/lib/links";
import {
  acceptRide,
  currentDriver,
  DEMO_MODE,
  finishRide,
  listRides,
  releaseRide,
  signIn,
  signOut,
  subscribeRides,
  type Driver,
  type Ride,
} from "@/lib/rides";
import { WhatsAppIcon } from "./whatsapp-icon";

type Tab = "pending" | "mine" | "others";

function timeAgo(iso: string, now: number) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return "ahora mismo";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-US", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// --- Alerta sonora -----------------------------------------------------------
// El navegador solo deja sonar audio después de que el chofer toca un botón,
// por eso el AudioContext se crea en "Activar alertas".
function useAlarm() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);

  const enable = useCallback(async () => {
    try {
      ctxRef.current ??= new AudioContext();
      await ctxRef.current.resume();
    } catch {}
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {}
    }
    setEnabled(true);
  }, []);

  const ring = useCallback(
    (body: string) => {
      const ctx = ctxRef.current;
      if (enabled && ctx) {
        const t0 = ctx.currentTime;
        // Dos toques tipo claxon, tres veces.
        for (let i = 0; i < 3; i++) {
          for (const [offset, freq] of [
            [0, 880],
            [0.18, 660],
          ] as const) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "square";
            osc.frequency.value = freq;
            const start = t0 + i * 0.6 + offset;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.17);
          }
        }
      }
      try {
        navigator.vibrate?.([300, 120, 300, 120, 300]);
      } catch {}
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Viaje nuevo", { body, icon: "/icon-192.png", tag: "viaje-nuevo" });
        } catch {}
      }
    },
    [enabled],
  );

  return { enabled, enable, ring, disable: () => setEnabled(false) };
}

export function DriverApp() {
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined);

  useEffect(() => {
    currentDriver().then(setDriver).catch(() => setDriver(null));
  }, []);

  if (driver === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-ambar" aria-label="Cargando" />
      </div>
    );
  }
  if (!driver) return <Login onDone={setDriver} />;
  return <Board driver={driver} onLogout={() => signOut().then(() => setDriver(null))} />;
}

// --- Login -------------------------------------------------------------------
function Login({ onDone }: { onDone: (d: Driver) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(email: string, password = "") {
    setBusy(true);
    setError(null);
    try {
      onDone(await signIn(email, password));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grano flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Image src="/images/logo.webp" alt="" width={120} height={120} className="mx-auto size-28" priority />
        <h1 className="font-display mt-4 text-center text-4xl font-extrabold uppercase">Panel de choferes</h1>
        <p className="mt-1 text-center text-niebla">Transportes Hermanos Ordaz</p>

        {DEMO_MODE ? (
          <div className="mt-8 space-y-3">
            <p className="rounded-md bg-ambar/15 px-4 py-3 text-sm text-ambar-claro">
              Modo demo: elige un hermano. Con la base de datos conectada, cada uno entra con su correo y contraseña.
            </p>
            {BROTHERS.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={busy}
                onClick={() => submit(String(b.id))}
                className="font-display flex h-14 w-full items-center justify-between rounded-md bg-noche-2 px-5 text-xl font-bold uppercase ring-1 ring-white/10 hover:bg-noche-3"
              >
                Soy {b.name}
                <span className="font-sans text-sm font-normal text-niebla">{formatPhone(b.phone)}</span>
              </button>
            ))}
          </div>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              submit(String(f.get("email")), String(f.get("password")));
            }}
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className="block h-12 w-full rounded-md border border-white/15 bg-noche-2 px-3.5 text-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block h-12 w-full rounded-md border border-white/15 bg-noche-2 px-3.5 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="font-display flex h-14 w-full items-center justify-center gap-2 rounded-md bg-ambar text-xl font-extrabold text-noche uppercase"
            >
              {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />} Entrar
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 text-center text-sm font-medium text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

// --- Tablero -----------------------------------------------------------------
function Board({ driver, onLogout }: { driver: Driver; onLogout: () => void }) {
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const known = useRef<Set<string> | null>(null);
  const alarm = useAlarm();
  const ringRef = useRef(alarm.ring);
  useEffect(() => {
    ringRef.current = alarm.ring;
  }, [alarm.ring]);

  const apply = useCallback((list: Ride[]) => {
    // Detecta viajes nuevos en espera para sonar la alerta.
    const pendingIds = list.filter((r) => r.status === "pending").map((r) => r.id);
    if (known.current) {
      const fresh = list.filter((r) => r.status === "pending" && !known.current!.has(r.id));
      if (fresh.length) {
        ringRef.current(`${fresh[0].customer_name} → ${fresh[0].destination}`);
        setTab("pending");
      }
    }
    known.current = new Set([...(known.current ?? []), ...pendingIds]);
    setRides(list);
  }, []);

  const load = useCallback(
    () =>
      listRides()
        .then(apply)
        .catch(() => setToast("Sin conexión. Reintentando…")),
    [apply],
  );

  useEffect(() => {
    load();
    const unsub = subscribeRides(() => load());
    const poll = setInterval(load, 30000); // respaldo por si se cae el tiempo real
    const tick = setInterval(() => setNow(Date.now()), 30000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsub();
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const groups = useMemo(() => {
    const list = rides ?? [];
    return {
      pending: list.filter((r) => r.status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at)),
      mine: list.filter((r) => r.status === "accepted" && r.driver_id === driver.id),
      others: list.filter((r) => r.status !== "pending" && !(r.status === "accepted" && r.driver_id === driver.id)),
    };
  }, [rides, driver.id]);

  useEffect(() => {
    const n = groups.pending.length;
    document.title = n ? `(${n}) En espera · Choferes` : "Panel de choferes";
  }, [groups.pending.length]);

  async function run(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch {
      setToast("Algo falló. Intenta otra vez.");
    } finally {
      setBusyId(null);
    }
  }

  const accept = (r: Ride) =>
    run(r.id, async () => {
      const won = await acceptRide(r.id);
      if (won) {
        setToast("¡Es tuyo! Escríbele al cliente.");
        setTab("mine");
      } else {
        setToast("Otro hermano lo tomó primero.");
      }
    });

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "En espera", count: groups.pending.length },
    { id: "mine", label: "Mis viajes", count: groups.mine.length },
    { id: "others", label: "Historial", count: groups.others.length },
  ];

  const shown = groups[tab];

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-noche/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Image src="/images/logo.webp" alt="" width={40} height={40} className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-xl leading-tight font-bold uppercase">{driver.name}</p>
            <p className="text-xs text-niebla">{DEMO_MODE ? "Modo demo" : "En línea"}</p>
          </div>
          <button
            type="button"
            onClick={alarm.enabled ? alarm.disable : alarm.enable}
            aria-label={alarm.enabled ? "Silenciar alertas" : "Activar alertas"}
            aria-pressed={alarm.enabled}
            className={`inline-flex size-11 items-center justify-center rounded-md ${
              alarm.enabled ? "bg-white/10 text-ambar" : "bg-rojo text-white"
            }`}
          >
            {alarm.enabled ? <Bell className="size-5" /> : <BellOff className="size-5" />}
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="inline-flex size-11 items-center justify-center rounded-md text-niebla hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-5" />
          </button>
        </div>
        {!alarm.enabled && (
          <button
            type="button"
            onClick={alarm.enable}
            className="animate-pulso flex w-full items-center justify-center gap-2 bg-rojo px-4 py-3 text-sm font-semibold text-white"
          >
            <Bell className="size-4" aria-hidden="true" />
            Toca aquí para activar el sonido de viajes nuevos
          </button>
        )}
        <div role="tablist" aria-label="Viajes" className="grid grid-cols-3 px-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`font-display flex h-12 items-center justify-center gap-2 border-b-4 text-base font-bold uppercase ${
                tab === t.id ? "border-ambar text-white" : "border-transparent text-niebla"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-sm ${
                    t.id === "pending" ? "bg-rojo text-white" : "bg-white/15 text-white"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 py-5">
        {rides === null ? (
          <Loader2 className="mx-auto mt-16 size-8 animate-spin text-ambar" aria-label="Cargando viajes" />
        ) : shown.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          shown.map((r) => (
            <RideCard
              key={r.id}
              ride={r}
              driver={driver}
              now={now}
              busy={busyId === r.id}
              onAccept={() => accept(r)}
              onRelease={() => run(r.id, () => releaseRide(r.id))}
              onComplete={() => run(r.id, () => finishRide(r.id, "completed"))}
              onDiscard={() => {
                if (confirm("¿Descartar este pedido? Nadie lo va a poder tomar.")) run(r.id, () => finishRide(r.id, "cancelled"));
              }}
            />
          ))
        )}
      </main>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
        {toast && (
          <p className="animate-entrar rounded-full bg-white px-5 py-3 font-semibold text-noche shadow-xl">{toast}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const text = {
    pending: ["Nada en espera", "Cuando un cliente pida un viaje desde la página, aparece aquí y suena la alerta."],
    mine: ["No tienes viajes activos", "Los viajes que aceptes aparecen aquí con la ruta y el WhatsApp del cliente."],
    others: ["Sin historial", "Aquí ves lo que tomaron tus hermanos y los viajes terminados de los últimos 3 días."],
  }[tab];
  return (
    <div className="mt-16 text-center">
      <div className="raya-h mx-auto w-24" aria-hidden="true" />
      <p className="font-display mt-6 text-2xl font-bold uppercase">{text[0]}</p>
      <p className="mx-auto mt-2 max-w-xs text-niebla">{text[1]}</p>
    </div>
  );
}

function RideCard({
  ride: r,
  driver,
  now,
  busy,
  onAccept,
  onRelease,
  onComplete,
  onDiscard,
}: {
  ride: Ride;
  driver: Driver;
  now: number;
  busy: boolean;
  onAccept: () => void;
  onRelease: () => void;
  onComplete: () => void;
  onDiscard: () => void;
}) {
  const pickup = { lat: r.pickup_lat, lng: r.pickup_lng, text: r.pickup_text };
  const hasGps = r.pickup_lat != null && r.pickup_lng != null;
  const mine = r.status === "accepted" && r.driver_id === driver.id;
  const pending = r.status === "pending";
  const fresh = pending && now - new Date(r.created_at).getTime() < 5 * 60000;

  const waText = `Hola ${r.customer_name}, soy ${driver.name} de Transportes Hermanos Ordaz. Ya tomé tu viaje a ${r.destination}. Te confirmo en un momento la hora y el precio.`;

  return (
    <article
      className={`overflow-hidden rounded-lg bg-noche-2 ring-1 ${
        fresh ? "animate-pulso ring-rojo" : mine ? "ring-ambar" : "ring-white/10"
      } ${!pending && !mine ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-ambar uppercase">
            {r.service} · {timeAgo(r.created_at, now)}
          </p>
          <h2 className="font-display mt-1 truncate text-2xl font-bold uppercase">{r.customer_name}</h2>
        </div>
        <StatusBadge ride={r} mine={mine} />
      </div>

      <dl className="mt-3 space-y-2.5 px-4 text-[15px]">
        <div className="flex gap-3">
          <dt className="sr-only">Recoger en</dt>
          <MapPin className="mt-0.5 size-5 shrink-0 text-ambar" aria-hidden="true" />
          <dd>
            {hasGps ? (
              <a href={googleMapsPin(pickup)} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
                Ubicación GPS{r.pickup_accuracy && r.pickup_accuracy > 60 ? ` (±${Math.round(r.pickup_accuracy)} m)` : ""}
              </a>
            ) : null}
            {r.pickup_text && <span className={hasGps ? "block text-niebla" : "font-semibold"}>{r.pickup_text}</span>}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="sr-only">Destino</dt>
          <Navigation className="mt-0.5 size-5 shrink-0 text-ambar" aria-hidden="true" />
          <dd className="font-semibold">{r.destination}</dd>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-niebla">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Cuándo</dt>
            <CalendarClock className="size-4" aria-hidden="true" />
            <dd className={r.scheduled_for ? "font-semibold text-white" : ""}>
              {r.scheduled_for ? formatWhen(r.scheduled_for) : "Ahora"}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Pasajeros</dt>
            <Users className="size-4" aria-hidden="true" />
            <dd>{r.passengers}</dd>
          </div>
          {(mine || !pending) && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Teléfono</dt>
              <Phone className="size-4" aria-hidden="true" />
              <dd className="tabular-nums">{formatPhone(r.customer_phone)}</dd>
            </div>
          )}
        </div>
        {r.notes && (
          <div className="flex gap-3 rounded-md bg-white/5 p-3">
            <dt className="sr-only">Notas</dt>
            <StickyNote className="mt-0.5 size-4 shrink-0 text-niebla" aria-hidden="true" />
            <dd className="text-niebla">{r.notes}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 border-t border-white/10 p-3">
        {pending && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="font-display flex h-16 flex-1 items-center justify-center gap-2 rounded-md bg-ambar text-2xl font-extrabold text-noche uppercase active:translate-y-0.5 disabled:opacity-70"
            >
              {busy ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <Check className="size-7" aria-hidden="true" />}
              Aceptar viaje
            </button>
            <button
              type="button"
              onClick={onDiscard}
              aria-label="Descartar pedido"
              className="inline-flex size-16 items-center justify-center rounded-md bg-white/5 text-niebla hover:bg-white/10"
            >
              <X className="size-6" />
            </button>
          </div>
        )}

        {mine && (
          <div className="grid grid-cols-2 gap-2">
            <ActionLink href={googleMapsTo(pickup)} className="bg-white text-noche">
              <Navigation className="size-5" aria-hidden="true" /> Google Maps
            </ActionLink>
            <ActionLink href={wazeTo(pickup)} className="bg-[#33ccff] text-noche">
              <Navigation className="size-5" aria-hidden="true" /> Waze
            </ActionLink>
            <ActionLink href={whatsappLink(r.customer_phone, waText)} className="bg-wa text-noche">
              <WhatsAppIcon /> WhatsApp
            </ActionLink>
            <ActionLink href={telLink(r.customer_phone)} className="bg-white/10 text-white" external={false}>
              <Phone className="size-5" aria-hidden="true" /> Llamar
            </ActionLink>
            <ActionLink href={googleMapsRoute(pickup, r.destination)} className="col-span-2 bg-white/10 text-white">
              <Route className="size-5" aria-hidden="true" /> Ver ruta completa al destino
            </ActionLink>
            <button
              type="button"
              onClick={onComplete}
              disabled={busy}
              className="font-display flex h-14 items-center justify-center gap-2 rounded-md bg-ambar text-lg font-bold text-noche uppercase"
            >
              <Check className="size-5" aria-hidden="true" /> Terminado
            </button>
            <button
              type="button"
              onClick={onRelease}
              disabled={busy}
              className="font-display flex h-14 items-center justify-center gap-2 rounded-md border border-white/20 text-lg font-bold text-niebla uppercase"
            >
              <Undo2 className="size-5" aria-hidden="true" /> Soltar
            </button>
          </div>
        )}

        {!pending && !mine && (
          <p className="px-1 text-sm text-niebla">
            {r.status === "accepted" && `Lo tomó ${r.driver_name}.`}
            {r.status === "completed" && `Terminado${r.driver_name ? ` por ${r.driver_name}` : ""}.`}
            {r.status === "cancelled" && "Descartado."}
          </p>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ ride, mine }: { ride: Ride; mine: boolean }) {
  const map = {
    pending: ["En espera", "bg-rojo text-white"],
    accepted: [mine ? "Tuyo" : "Tomado", mine ? "bg-ambar text-noche" : "bg-white/15 text-white"],
    completed: ["Terminado", "bg-white/10 text-niebla"],
    cancelled: ["Descartado", "bg-white/10 text-niebla"],
  } as const;
  const [label, cls] = map[ride.status];
  return <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-bold uppercase ${cls}`}>{label}</span>;
}

function ActionLink({
  href,
  className,
  children,
  external = true,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`font-display flex h-14 items-center justify-center gap-2 rounded-md text-lg font-bold uppercase ${className}`}
    >
      {children}
    </a>
  );
}
