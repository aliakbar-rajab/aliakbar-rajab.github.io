export function localizeCatalogValue(value: string) {
  if (!value) return "—";
  // This formats dimensions and spec values (sizes, lengths, weights), never
  // money -- prices go through RebarPrices.tsx's own formatNumber. Grouping
  // must stay off here, or "1250" (a length in mm) becomes "۱٬۲۵۰".
  return value.replace(/\d+(?:\.\d+)?/g, (part) =>
    Number(part).toLocaleString("fa-IR", {
      maximumFractionDigits: Math.min(part.split(".")[1]?.length ?? 0, 20),
      useGrouping: false,
    }),
  );
}
