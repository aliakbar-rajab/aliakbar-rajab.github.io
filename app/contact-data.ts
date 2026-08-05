import { siteConfig } from "./site-config";

export const phones = siteConfig.contact.phones;

export const address = siteConfig.business.address;

export const shortAddress = siteConfig.business.shortAddress;

export const postalCode = siteConfig.business.postalCode;

export const managementContacts = siteConfig.contact.management;

export const officialEmail = siteConfig.contact.officialEmail;

export const whatsappCommunityUrl = siteConfig.contact.whatsappCommunityUrl;

/**
 * GPS pin for the office (پور ابتهاج، لشگری، آجودانیه) confirmed against the
 * owner-supplied Neshan share link -- do not adjust without a new pin, the
 * map buttons on the contact page depend on this being exact.
 */
export const officeCoordinates = siteConfig.officeCoordinates;

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
export const neshanShareUrl = siteConfig.neshanShareUrl;
