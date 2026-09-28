export const BUSINESS = {
  name: "Transportes Hermanos Ordaz",
  shortName: "Hermanos Ordaz",
  city: "Asbury Park",
  state: "NJ",
  // Número principal (el que aparece en los flyers grandes).
  mainPhone: "7328291070",
  url: "https://transportes-hermanos-ordaz.vercel.app",
};

export type Brother = {
  id: 1 | 2 | 3 | 4;
  name: string;
  phone: string; // 10 dígitos, sin +1
};

// TODO: Cambiar "Hermano N" por los nombres reales cuando los tengan.
export const BROTHERS: Brother[] = [
  { id: 1, name: "Hermano 1", phone: "7328291070" },
  { id: 2, name: "Hermano 2", phone: "7327205723" },
  { id: 3, name: "Hermano 3", phone: "8483305501" },
  { id: 4, name: "Hermano 4", phone: "7325275019" },
];

export const SERVICE_OPTIONS = [
  "Viaje local",
  "Aeropuerto",
  "Viaje a otro estado",
  "Delivery",
  "Servicio estudiantil",
  "City tour",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];
