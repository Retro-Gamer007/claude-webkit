"use client";

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Loader2, LocateFixed, RotateCcw, TriangleAlert } from "lucide-react";
import { BUSINESS, SERVICE_OPTIONS } from "@/lib/config";
import { googleMapsPin, whatsappLink } from "@/lib/links";
import { createRide, DEMO_MODE, getRideStatus, type NewRide, type PublicStatus } from "@/lib/rides";
import { WhatsAppIcon } from "./whatsapp-icon";

type Geo =
  | { state: "idle" }
  | { state: "locating" }
  | { state: "ok"; lat: number; lng: number; accuracy: number }
  | { state: "error"; message: string };

const MY_RIDE_KEY = "tho-mi-viaje";
const MY_RIDE_EVENT = "tho-mi-viaje-cambio";

type SentRide = { id: string; ride: NewRide };

// El viaje del cliente vive en localStorage para que siga ahí si recarga la página.
function subscribeMyRide(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(MY_RIDE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(MY_RIDE_EVENT, cb);
  };
}
function readMyRide() {
  try {
    return localStorage.getItem(MY_RIDE_KEY);
  } catch {
    return null;
  }
}
function saveMyRide(value: SentRide | null) {
  try {
    if (value) localStorage.setItem(MY_RIDE_KEY, JSON.stringify(value));
    else localStorage.removeItem(MY_RIDE_KEY);
  } catch {}
  window.dispatchEvent(new Event(MY_RIDE_EVENT));
}

const field =
  "block w-full rounded-md border border-noche/20 bg-white px-3.5 py-3 text-base text-tinta placeholder:text-gris/70 focus:border-noche focus:outline-none focus-visible:outline-3 focus-visible:outline-ambar";
const labelCls = "mb-1.5 block text-sm font-semibold text-tinta";

function buildWhatsappSummary(r: NewRide) {
  const lines = [
    `Hola, acabo de pedir un viaje en la página.`,
    `Nombre: ${r.customer_name}`,
    `Servicio: ${r.service}`,
  ];
  if (r.pickup_lat != null && r.pickup_lng != null) {
    lines.push(`Me recogen aquí: ${googleMapsPin({ lat: r.pickup_lat, lng: r.pickup_lng })}`);
  }
  if (r.pickup_text) lines.push(`Referencia: ${r.pickup_text}`);
  lines.push(`Voy a: ${r.destination}`);
  lines.push(
    r.scheduled_for
      ? `Cuándo: ${new Date(r.scheduled_for).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" })}`
      : "Cuándo: ahora",
  );
  lines.push(`Pasajeros: ${r.passengers}`);
  return lines.join("\n");
}

export function RideRequestForm() {
  const ids = useId();
  const [geo, setGeo] = useState<Geo>({ state: "idle" });
  const [when, setWhen] = useState<"now" | "later">("now");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const savedRaw = useSyncExternalStore(subscribeMyRide, readMyRide, () => null);
  const sent = useMemo<SentRide | null>(() => {
    try {
      return savedRaw ? (JSON.parse(savedRaw) as SentRide) : null;
    } catch {
      return null;
    }
  }, [savedRaw]);

  const sentId = sent?.id;
  const finished = status?.status === "completed" || status?.status === "cancelled";
  useEffect(() => {
    if (!sentId || finished) return;
    const check = () =>
      getRideStatus(sentId)
        .then(setStatus)
        .catch(() => {});
    check();
    const t = setInterval(check, 4000);
    return () => clearInterval(t);
  }, [sentId, finished]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeo({ state: "error", message: "Tu teléfono no permite compartir ubicación. Escribe la dirección abajo." });
      return;
    }
    setGeo({ state: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          state: "ok",
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        }),
      (err) =>
        setGeo({
          state: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "No diste permiso de ubicación. Actívalo en los ajustes del navegador o escribe tu dirección abajo."
              : "No pudimos encontrarte. Intenta otra vez o escribe tu dirección abajo.",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();

    const phone = get("phone").replace(/\D/g, "");
    const pickupText = get("pickup_text");
    const scheduled = get("scheduled_for");

    if (phone.length < 10) return setError("Revisa tu teléfono: necesitamos los 10 dígitos.");
    if (geo.state !== "ok" && !pickupText)
      return setError("Toca “Usar mi ubicación” o escribe dónde te recogemos.");
    if (when === "later" && !scheduled) return setError("Elige el día y la hora del viaje.");

    const ride: NewRide = {
      customer_name: get("name"),
      customer_phone: phone,
      service: get("service"),
      pickup_lat: geo.state === "ok" ? geo.lat : null,
      pickup_lng: geo.state === "ok" ? geo.lng : null,
      pickup_accuracy: geo.state === "ok" ? geo.accuracy : null,
      pickup_text: pickupText || null,
      destination: get("destination"),
      scheduled_for: when === "later" ? new Date(scheduled).toISOString() : null,
      passengers: Number(get("passengers")) || 1,
      notes: get("notes") || null,
    };

    setSubmitting(true);
    try {
      const id = await createRide(ride);
      setStatus({ status: "pending", driver_name: null, driver_phone: null });
      saveMyRide({ id, ride });
    } catch {
      setError("No se pudo enviar. Revisa tu conexión o escríbenos directo por WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    saveMyRide(null);
    setStatus(null);
    setGeo({ state: "idle" });
    setWhen("now");
  }

  if (sent) return <Confirmation ride={sent.ride} status={status} onReset={reset} />;

  return (
    <form onSubmit={onSubmit} noValidate={false} className="space-y-6">
      {DEMO_MODE && (
        <p className="rounded-md border border-ambar bg-ambar/15 px-4 py-3 text-sm text-tinta">
          <strong>Modo demo:</strong> los pedidos se guardan solo en este navegador hasta conectar la base de datos.
        </p>
      )}

      {/* Ubicación */}
      <fieldset className="rounded-lg border-2 border-dashed border-noche/25 bg-white p-4 sm:p-5">
        <legend className="font-display px-2 text-lg font-bold tracking-wide uppercase">¿Dónde te recogemos?</legend>
        <button
          type="button"
          onClick={locate}
          disabled={geo.state === "locating"}
          className="font-display flex h-14 w-full items-center justify-center gap-2 rounded-md bg-noche text-lg font-bold tracking-wide text-white uppercase transition-colors hover:bg-noche-3 disabled:opacity-70"
        >
          {geo.state === "locating" ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-5 text-ambar" aria-hidden="true" />
          )}
          {geo.state === "ok" ? "Actualizar mi ubicación" : geo.state === "locating" ? "Buscando…" : "Usar mi ubicación"}
        </button>

        <div aria-live="polite" className="mt-3 text-sm">
          {geo.state === "ok" && (
            <p className="flex items-start gap-2 text-tinta">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-700" aria-hidden="true" />
              <span>
                Listo, te tenemos ubicado{geo.accuracy > 60 ? ` (margen de ${geo.accuracy} m)` : ""}.{" "}
                <a
                  href={googleMapsPin(geo)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-2"
                >
                  Ver en el mapa
                </a>
              </span>
            </p>
          )}
          {geo.state === "error" && (
            <p className="flex items-start gap-2 text-rojo">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {geo.message}
            </p>
          )}
          {geo.state === "idle" && (
            <p className="text-gris">Tu teléfono te va a pedir permiso. Solo la usamos para ir por ti.</p>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor={`${ids}-pickup`} className={labelCls}>
            Dirección o referencia {geo.state === "ok" ? <span className="font-normal text-gris">(opcional)</span> : null}
          </label>
          <input
            id={`${ids}-pickup`}
            name="pickup_text"
            maxLength={200}
            autoComplete="street-address"
            placeholder="Ej. 1200 Main St, casa azul, apto 3"
            className={field}
          />
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${ids}-dest`} className={labelCls}>
            ¿A dónde vas?
          </label>
          <input
            id={`${ids}-dest`}
            name="destination"
            required
            maxLength={200}
            placeholder="Ej. Aeropuerto de Newark, terminal C"
            className={field}
          />
        </div>

        <div>
          <label htmlFor={`${ids}-name`} className={labelCls}>
            Tu nombre
          </label>
          <input id={`${ids}-name`} name="name" required maxLength={80} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor={`${ids}-phone`} className={labelCls}>
            Tu WhatsApp o teléfono
          </label>
          <input
            id={`${ids}-phone`}
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="(732) 555-0123"
            className={field}
          />
        </div>

        <div>
          <label htmlFor={`${ids}-service`} className={labelCls}>
            Tipo de viaje
          </label>
          <select id={`${ids}-service`} name="service" className={field} defaultValue={SERVICE_OPTIONS[0]}>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${ids}-pax`} className={labelCls}>
            Pasajeros
          </label>
          <select id={`${ids}-pax`} name="passengers" className={field} defaultValue="1">
            {Array.from({ length: 7 }, (_, i) => (
              <option key={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={labelCls}>¿Cuándo?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["now", "Ahora"],
              ["later", "Programar"],
            ] as const
          ).map(([v, l]) => (
            <label
              key={v}
              className={`flex h-12 cursor-pointer items-center justify-center rounded-md border-2 font-semibold transition-colors has-focus-visible:outline-3 has-focus-visible:outline-ambar ${
                when === v ? "border-noche bg-noche text-white" : "border-noche/20 bg-white text-tinta"
              }`}
            >
              <input
                type="radio"
                name="when"
                value={v}
                checked={when === v}
                onChange={() => setWhen(v)}
                className="sr-only"
              />
              {l}
            </label>
          ))}
        </div>
        {when === "later" && (
          <div className="mt-3">
            <label htmlFor={`${ids}-date`} className={labelCls}>
              Día y hora
            </label>
            <input id={`${ids}-date`} name="scheduled_for" type="datetime-local" required className={field} />
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor={`${ids}-notes`} className={labelCls}>
          Algo más <span className="font-normal text-gris">(opcional)</span>
        </label>
        <textarea
          id={`${ids}-notes`}
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Maletas, número de vuelo, silla para bebé…"
          className={field}
        />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-rojo/10 px-4 py-3 text-sm font-medium text-rojo">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="font-display flex h-16 w-full items-center justify-center gap-2 rounded-md bg-ambar text-2xl font-extrabold tracking-wide text-noche uppercase shadow-[0_6px_0_#b9861a] transition-[transform,box-shadow] hover:bg-ambar-claro active:translate-y-1 active:shadow-[0_2px_0_#b9861a] disabled:opacity-70"
      >
        {submitting ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : null}
        {submitting ? "Enviando…" : "Pedir viaje"}
      </button>
      <p className="text-center text-sm text-gris">
        Le llega a los cuatro hermanos al mismo tiempo. El primero que esté libre te escribe.
      </p>
    </form>
  );
}

function Confirmation({
  ride,
  status,
  onReset,
}: {
  ride: NewRide;
  status: PublicStatus | null;
  onReset: () => void;
}) {
  const s = status?.status ?? "pending";
  const accepted = s === "accepted" && status?.driver_name;

  return (
    <div className="animate-entrar space-y-6" aria-live="polite">
      <div className="rounded-lg bg-noche p-6 text-white">
        {s === "pending" && (
          <>
            <p className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ambar opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-ambar" />
              </span>
              <span className="font-display text-2xl font-bold uppercase">Pedido enviado</span>
            </p>
            <p className="mt-2 text-niebla">
              Esperando a que un hermano lo acepte. Casi siempre es cuestión de minutos. Deja esta página abierta.
            </p>
          </>
        )}
        {accepted && (
          <>
            <p className="font-display flex items-center gap-2 text-2xl font-bold uppercase">
              <CheckCircle2 className="size-6 text-ambar" aria-hidden="true" />
              {status!.driver_name} va por ti
            </p>
            <p className="mt-2 text-niebla">Te va a escribir por WhatsApp para confirmar hora y precio.</p>
          </>
        )}
        {s === "completed" && <p className="font-display text-2xl font-bold uppercase">Viaje terminado. ¡Gracias!</p>}
        {s === "cancelled" && (
          <p className="font-display text-2xl font-bold uppercase">Este viaje se canceló. Escríbenos si fue un error.</p>
        )}

        <dl className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex gap-2">
            <dt className="text-niebla">Destino:</dt>
            <dd className="font-medium">{ride.destination}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-niebla">Servicio:</dt>
            <dd className="font-medium">{ride.service}</dd>
          </div>
        </dl>
      </div>

      {accepted && status?.driver_phone ? (
        <a
          href={whatsappLink(status.driver_phone, `Hola ${status.driver_name}, soy ${ride.customer_name}. Ya vi que aceptaste mi viaje.`)}
          target="_blank"
          rel="noreferrer"
          className="font-display flex h-14 items-center justify-center gap-2 rounded-md bg-wa text-lg font-bold text-noche uppercase"
        >
          <WhatsAppIcon /> Escribirle a {status.driver_name}
        </a>
      ) : (
        <a
          href={whatsappLink(BUSINESS.mainPhone, buildWhatsappSummary(ride))}
          target="_blank"
          rel="noreferrer"
          className="font-display flex h-14 items-center justify-center gap-2 rounded-md bg-wa text-lg font-bold text-noche uppercase"
        >
          <WhatsAppIcon /> ¿Prisa? Avísanos por WhatsApp
        </a>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mx-auto flex items-center gap-2 text-sm font-semibold text-gris underline underline-offset-4 hover:text-tinta"
      >
        <RotateCcw className="size-4" aria-hidden="true" /> Pedir otro viaje
      </button>
    </div>
  );
}
