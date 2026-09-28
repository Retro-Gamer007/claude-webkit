export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (d.length !== 10) return digits;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Número en formato internacional sin "+" (lo que pide wa.me). */
export function intlDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `1${d}` : d;
}

export function whatsappLink(phone: string, text?: string) {
  const base = `https://wa.me/${intlDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(phone: string) {
  return `tel:+${intlDigits(phone)}`;
}

type Place = { lat?: number | null; lng?: number | null; text?: string | null };

function placeParam(p: Place) {
  if (p.lat != null && p.lng != null) return `${p.lat},${p.lng}`;
  return p.text ?? "";
}

/** Navegación de Google Maps hacia el punto de recogida. */
export function googleMapsTo(p: Place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    placeParam(p),
  )}&travelmode=driving`;
}

export function wazeTo(p: Place) {
  if (p.lat != null && p.lng != null) {
    return `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(p.text ?? "")}&navigate=yes`;
}

/** Ruta completa: recogida → destino. */
export function googleMapsRoute(from: Place, to: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    placeParam(from),
  )}&destination=${encodeURIComponent(to)}&travelmode=driving`;
}

export function googleMapsPin(p: Place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeParam(p))}`;
}
