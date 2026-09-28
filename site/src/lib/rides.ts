"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BROTHERS } from "./config";

export type RideStatus = "pending" | "accepted" | "completed" | "cancelled";

export type Ride = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_accuracy: number | null;
  pickup_text: string | null;
  destination: string;
  scheduled_for: string | null;
  passengers: number;
  notes: string | null;
  status: RideStatus;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  accepted_at: string | null;
  completed_at: string | null;
};

export type NewRide = Pick<
  Ride,
  | "customer_name"
  | "customer_phone"
  | "service"
  | "pickup_lat"
  | "pickup_lng"
  | "pickup_accuracy"
  | "pickup_text"
  | "destination"
  | "scheduled_for"
  | "passengers"
  | "notes"
>;

export type PublicStatus = {
  status: RideStatus;
  driver_name: string | null;
  driver_phone: string | null;
};

export type Driver = { id: string; name: string; phone: string };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Sin Supabase configurado, todo corre en modo demo dentro del navegador. */
export const DEMO_MODE = !url || !key;

let client: SupabaseClient | null = null;
function sb() {
  if (!client) client = createClient(url!, key!);
  return client;
}

// ---------------------------------------------------------------------------
// Modo demo: viajes guardados en localStorage y sincronizados entre pestañas.
// Sirve para probar la página del cliente y el panel en la misma computadora.
// ---------------------------------------------------------------------------
const DEMO_KEY = "tho-demo-rides";
const DEMO_DRIVER_KEY = "tho-demo-driver";
const channelName = "tho-rides";

function demoRead(): Ride[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) ?? "[]") as Ride[];
  } catch {
    return [];
  }
}

function demoWrite(rides: Ride[]) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(rides.slice(0, 100)));
  } catch {}
  try {
    const bc = new BroadcastChannel(channelName);
    bc.postMessage("changed");
    bc.close();
  } catch {}
}

function demoUpdate(id: string, fn: (r: Ride) => Ride | null): Ride | null {
  const rides = demoRead();
  const i = rides.findIndex((r) => r.id === id);
  if (i < 0) return null;
  const next = fn(rides[i]);
  if (!next) return null;
  rides[i] = next;
  demoWrite(rides);
  return next;
}

function demoDriver(): Driver | null {
  try {
    const id = localStorage.getItem(DEMO_DRIVER_KEY);
    const b = BROTHERS.find((x) => String(x.id) === id);
    return b ? { id: String(b.id), name: b.name, phone: b.phone } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
export async function createRide(input: NewRide): Promise<string> {
  const id = crypto.randomUUID();
  if (DEMO_MODE) {
    const ride: Ride = {
      ...input,
      id,
      created_at: new Date().toISOString(),
      status: "pending",
      driver_id: null,
      driver_name: null,
      driver_phone: null,
      accepted_at: null,
      completed_at: null,
    };
    demoWrite([ride, ...demoRead()]);
    return id;
  }
  // El cliente no tiene permiso de leer la tabla, por eso el id se genera aquí.
  const { error } = await sb().from("rides").insert({ id, ...input });
  if (error) throw error;
  return id;
}

export async function getRideStatus(id: string): Promise<PublicStatus | null> {
  if (DEMO_MODE) {
    const r = demoRead().find((x) => x.id === id);
    return r ? { status: r.status, driver_name: r.driver_name, driver_phone: r.driver_phone } : null;
  }
  const { data, error } = await sb().rpc("ride_status", { ride_id: id });
  if (error) throw error;
  return (data as PublicStatus[])[0] ?? null;
}

// ---------------------------------------------------------------------------
// Choferes
// ---------------------------------------------------------------------------
export async function currentDriver(): Promise<Driver | null> {
  if (DEMO_MODE) return demoDriver();
  const { data } = await sb().auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: row } = await sb()
    .from("drivers")
    .select("name, phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return null;
  return { id: user.id, name: row.name, phone: row.phone };
}

export async function signIn(email: string, password: string): Promise<Driver> {
  if (DEMO_MODE) {
    // En demo, "email" trae el número de hermano elegido.
    localStorage.setItem(DEMO_DRIVER_KEY, email);
    const d = demoDriver();
    if (!d) throw new Error("Elige un hermano");
    return d;
  }
  const { error } = await sb().auth.signInWithPassword({ email, password });
  if (error) throw new Error("Correo o contraseña incorrectos");
  const d = await currentDriver();
  if (!d) {
    await sb().auth.signOut();
    throw new Error("Esta cuenta no está dada de alta como chofer");
  }
  return d;
}

export async function signOut() {
  if (DEMO_MODE) {
    localStorage.removeItem(DEMO_DRIVER_KEY);
    return;
  }
  await sb().auth.signOut();
}

export async function listRides(): Promise<Ride[]> {
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  if (DEMO_MODE) return demoRead().filter((r) => r.created_at >= since);
  const { data, error } = await sb()
    .from("rides")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Ride[];
}

/** Avisa cada vez que algo cambia. Devuelve la función para desuscribirse. */
export function subscribeRides(onChange: (ride?: Ride, isNew?: boolean) => void) {
  if (DEMO_MODE) {
    const bc = new BroadcastChannel(channelName);
    bc.onmessage = () => onChange();
    const onStorage = (e: StorageEvent) => e.key === DEMO_KEY && onChange();
    window.addEventListener("storage", onStorage);
    return () => {
      bc.close();
      window.removeEventListener("storage", onStorage);
    };
  }
  const channel = sb()
    .channel("rides-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, (payload) => {
      onChange(payload.new as Ride, payload.eventType === "INSERT");
    })
    .subscribe();
  return () => {
    sb().removeChannel(channel);
  };
}

/** Devuelve el viaje si lo ganaste; null si otro hermano lo tomó primero. */
export async function acceptRide(id: string): Promise<Ride | null> {
  if (DEMO_MODE) {
    const d = demoDriver();
    if (!d) return null;
    return demoUpdate(id, (r) =>
      r.status !== "pending"
        ? null
        : {
            ...r,
            status: "accepted",
            driver_id: d.id,
            driver_name: d.name,
            driver_phone: d.phone,
            accepted_at: new Date().toISOString(),
          },
    );
  }
  const { data, error } = await sb().rpc("accept_ride", { ride_id: id });
  if (error) throw error;
  const ride = data as Ride | null;
  return ride?.id ? ride : null;
}

export async function releaseRide(id: string) {
  if (DEMO_MODE) {
    const d = demoDriver();
    demoUpdate(id, (r) =>
      r.status === "accepted" && r.driver_id === d?.id
        ? { ...r, status: "pending", driver_id: null, driver_name: null, driver_phone: null, accepted_at: null }
        : null,
    );
    return;
  }
  const { error } = await sb().rpc("release_ride", { ride_id: id });
  if (error) throw error;
}

export async function finishRide(id: string, status: "completed" | "cancelled") {
  if (DEMO_MODE) {
    const d = demoDriver();
    demoUpdate(id, (r) =>
      r.driver_id === d?.id || (r.status === "pending" && status === "cancelled")
        ? { ...r, status, completed_at: new Date().toISOString() }
        : null,
    );
    return;
  }
  const { error } = await sb().rpc("finish_ride", { ride_id: id, new_status: status });
  if (error) throw error;
}
