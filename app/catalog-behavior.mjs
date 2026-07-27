export function calculateRebarWeight(diameter, length, quantity) {
  const parsedDiameter = Number(diameter);
  const parsedLength = Number(length);
  const parsedQuantity = Number(quantity);
  if (
    !Number.isFinite(parsedDiameter) ||
    !Number.isFinite(parsedLength) ||
    !Number.isInteger(parsedQuantity) ||
    parsedDiameter <= 0 ||
    parsedLength <= 0 ||
    parsedQuantity <= 0
  ) {
    return null;
  }
  return ((parsedDiameter ** 2) / 162) * parsedLength * parsedQuantity;
}

export function getTrendPresentation(status, percent) {
  const amount = Math.abs(Number(percent) || 0);
  if (amount === 0) {
    return { direction: "بدون تغییر", symbol: "—", amount: 0 };
  }
  if (status === "up") {
    return { direction: "افزایش", symbol: "↑", amount };
  }
  if (status === "down") {
    return { direction: "کاهش", symbol: "↓", amount };
  }
  return { direction: "بدون تغییر", symbol: "—", amount: 0 };
}

export function getCategoryPricingState(category) {
  const pricedRows = category.factories
    .flatMap((factory) => factory.rows)
    .filter((row) => row.price !== null);
  return {
    hasPrices: pricedRows.length > 0,
    units: [...new Set(pricedRows.map((row) => row.unit).filter(Boolean))],
  };
}
