export function money(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"}).format(Number(value || 0));
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150) || "item";
}

export function stableSlug(name: string, externalId: string) {
  const suffix = externalId.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toLowerCase() || "origem";
  return `${slugify(name)}-${suffix}`.slice(0, 191);
}

export function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
