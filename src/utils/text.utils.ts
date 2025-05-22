/**
 * Converts text to ASCII-only by removing or replacing non-ASCII characters.
 */
export function asciifyText(text: string): string {
  if (!text) return '';

  const normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  return normalized
    .replace(/[^\x00-\x7F]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Sanitizes text for storage by:
 * 1. Converting special characters to their basic Latin equivalents
 * 2. Removing any remaining problematic characters
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  const normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  return normalized
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Creates a location ID following the convention: [country_code]_[region_abbrev]_[city_abbrev]
 */
export function createLocationId(
  city: string,
  adminName: string,
  countryCode: string,
): string {
  const cleanCity = sanitizeText(city).toLowerCase();
  const cleanRegion = sanitizeText(adminName).toLowerCase();
  const cleanCountry = countryCode.toLowerCase();

  const regionAbbrev = cleanRegion.replace(/[aeiou]/g, '').slice(0, 5);
  const cityAbbrev = cleanCity.replace(/[aeiou]/g, '').slice(0, 5);

  return `${cleanCountry}_${regionAbbrev}_${cityAbbrev}`;
}
