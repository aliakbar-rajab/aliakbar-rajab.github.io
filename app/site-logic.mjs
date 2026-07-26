const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert Persian and Arabic digits to ASCII digits. */
export function toAsciiDigits(value = "") {
  return String(value).replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    return String(
      persianIndex >= 0 ? persianIndex : ARABIC_DIGITS.indexOf(digit),
    );
  });
}

export function normalizeSearchText(value = "") {
  return toAsciiDigits(value)
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

/**
 * Search all product groups and retain only groups containing matching rows.
 * @param {Array<{id:string,label:string,rows:Array<{product:string,origin:string,unit:string}>}>} groups
 * @param {string} query
 */
export function filterProductGroups(groups, query) {
  const needle = normalizeSearchText(query);
  if (!needle) return groups;

  return groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) =>
        normalizeSearchText(
          `${group.label} ${row.product} ${row.origin} ${row.unit}`,
        ).includes(needle),
      ),
    }))
    .filter((group) => group.rows.length > 0);
}
