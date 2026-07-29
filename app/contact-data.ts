export const phones = [
  { label: "021-88888280", href: "tel:+982188888280" },
  { label: "021-88888780", href: "tel:+982188888780" },
  { label: "021-88888122", href: "tel:+982188888122" },
  { label: "021-88889005", href: "tel:+982188889005" },
  { label: "021-88889006", href: "tel:+982188889006" },
];

export const address = "آجودانیه پورابتهاج نبش لشکری ساختمان سرو واحد ۳۰۳";

export const postalCode = "1978977198";

export const managementContacts = [
  { name: "اسماعیل‌پور", href: "tel:+989123300815", label: "09123300815" },
  { name: "کریمی", href: "tel:+989126333326", label: "09126333326" },
];

/**
 * GPS pin for the office (پور ابتهاج، لشگری، آجودانیه) confirmed against the
 * owner-supplied Neshan share link -- do not adjust without a new pin, the
 * map buttons on the contact page depend on this being exact.
 */
export const officeCoordinates = { lat: 35.817127, lng: 51.4809619 };

export function buildGoogleMapsUrl({ lat, lng }: typeof officeCoordinates) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function buildWazeUrl({ lat, lng }: typeof officeCoordinates) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

/**
 * Neshan's own share link for the pin. Not built from officeCoordinates:
 * neshan.org/maps ignores a `#c<lat>-<lng>-<zoom>z` hash on a fresh page
 * load (verified -- it resets to the generic Tehran-wide view every time),
 * so a constructed coordinate link silently opens the wrong view. The
 * nshn.ir share link is the one confirmed way to land on the right pin.
 */
export const neshanShareUrl = "https://nshn.ir/QbvL2OWxRwI7";
