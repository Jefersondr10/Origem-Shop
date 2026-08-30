const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "Consulte";
  return new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"}).format(value);
}

function datePartsInSaoPaulo(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function toMysqlDate(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  const parts = datePartsInSaoPaulo(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function toDateTimeLocal(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    const sqlDate = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (sqlDate) return `${sqlDate[1]}T${sqlDate[2]}`;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const parts = datePartsInSaoPaulo(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function saoPauloDateTimeToMysql(value: FormDataEntryValue | null): string | null {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(text)) {
    throw new Error("Data e hora inválidas.");
  }
  return text.replace("T", " ") + (text.length === 16 ? ":00" : "");
}

export function parseSaoPauloDateTime(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  const text = String(value).trim();
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}-03:00`;
  const timestamp = new Date(withZone).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function uniqueSlug(base: string, externalId: string): string {
  const suffix = slugify(externalId).slice(-12);
  return suffix && suffix !== "item" ? `${slugify(base)}-${suffix}` : slugify(base);
}

export function optionalHttpUrl(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error("Informe uma URL válida.");
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("A URL deve começar com http:// ou https://.");
  return parsed.toString();
}
