function categoriesForGroup(groupId, rebar, beam, products) {
  if (groupId === "rebar") return rebar.categories;
  if (groupId === "beam") return beam.categories;
  return (
    products.catalogs.find((catalog) => catalog.id === groupId)?.categories ?? []
  );
}

export function buildCatalogSearchGroups(
  baseGroups,
  { rebar, beam, products },
) {
  return baseGroups.map((group) => ({
    ...group,
    rows: categoriesForGroup(group.id, rebar, beam, products).flatMap(
      (category) =>
        category.factories.flatMap((factory) =>
          factory.rows.map((row) => ({
            product: row.title,
            origin: row.factory || factory.name || row.delivery || "—",
            unit: row.unit || "—",
            categoryId: category.id,
            factory: factory.name,
            size: row.size,
            searchText: [
              category.label,
              category.sourceTitle,
              row.title,
              row.size,
              row.specification,
              row.standard,
              row.grade,
              row.branchLength,
              row.form,
              row.delivery,
              row.unit,
              row.factory,
              factory.name,
              ...(row.specifications ?? []).flatMap((item) => [
                item.label,
                item.value,
              ]),
            ]
              .filter(Boolean)
              .join(" "),
          })),
        ),
    ),
  }));
}
