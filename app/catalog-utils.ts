export function localizeCatalogValue(value: string) {
  if (!value) return "—";
  return value.replace(/\d+(?:\.\d+)?/g, (part) =>
    Number(part).toLocaleString("fa-IR", {
      maximumFractionDigits: Math.min(part.split(".")[1]?.length ?? 0, 20),
    }),
  );
}
