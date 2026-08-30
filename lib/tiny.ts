import type {RowDataPacket} from "mysql2/promise";
import {z} from "zod";
import {execute, isDatabaseConfigured, queryRows} from "@/lib/db";
import {decryptSecret, encryptSecret} from "@/lib/token-crypto";

const AUTHORIZE_URL = "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth";
const TOKEN_URL = "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token";
const DEFAULT_API_URL = "https://api.tiny.com.br/public-api/v3";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.coerce.number().positive().default(14_400),
  refresh_expires_in: z.coerce.number().positive().default(86_400),
});

type TokenResponse = z.infer<typeof tokenResponseSchema>;

interface TinyConnectionRow extends RowDataPacket {
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  expires_at_ms: string | number;
  refresh_expires_at_ms: string | number;
  connected_at: string;
}

interface MissingCostRow extends RowDataPacket {
  id: number;
  tiny_product_id: string;
}

function credentials(): {clientId: string; clientSecret: string} {
  const clientId = process.env.TINY_CLIENT_ID;
  const clientSecret = process.env.TINY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("TINY_CLIENT_ID e TINY_CLIENT_SECRET não configurados.");
  return {clientId, clientSecret};
}

export function tinyRedirectUri(): string {
  if (process.env.TINY_REDIRECT_URI) return process.env.TINY_REDIRECT_URI;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL ou TINY_REDIRECT_URI não configurada.");
  return `${siteUrl}/api/tiny/callback`;
}

export function tinyAuthorizationUrl(state: string): string {
  const {clientId} = credentials();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", tinyRedirectUri());
  url.searchParams.set("scope", "openid");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}

async function tokenRequest(values: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded", Accept: "application/json"},
    body: new URLSearchParams(values),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`O Tiny recusou a autorização (${response.status}): ${detail}`);
  }
  return tokenResponseSchema.parse(await response.json());
}

async function saveTokens(tokens: TokenResponse): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("O banco precisa estar configurado para armazenar a autorização do Tiny.");
  const now = Date.now();
  await execute(`
    INSERT INTO tiny_connections (
      id, access_token_encrypted, refresh_token_encrypted,
      expires_at_ms, refresh_expires_at_ms, connected_at
    ) VALUES ('primary', ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      access_token_encrypted = VALUES(access_token_encrypted),
      refresh_token_encrypted = VALUES(refresh_token_encrypted),
      expires_at_ms = VALUES(expires_at_ms),
      refresh_expires_at_ms = VALUES(refresh_expires_at_ms),
      connected_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `, [
    encryptSecret(tokens.access_token),
    encryptSecret(tokens.refresh_token),
    now + tokens.expires_in * 1000,
    now + tokens.refresh_expires_in * 1000,
  ]);
}

export async function exchangeTinyAuthorizationCode(code: string): Promise<void> {
  const {clientId, clientSecret} = credentials();
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: tinyRedirectUri(),
    code,
  });
  await saveTokens(tokens);
}

async function connectionRow(): Promise<TinyConnectionRow | null> {
  if (!isDatabaseConfigured()) return null;
  const rows = await queryRows<TinyConnectionRow>(`
    SELECT access_token_encrypted, refresh_token_encrypted,
      expires_at_ms, refresh_expires_at_ms, connected_at
    FROM tiny_connections
    WHERE id = 'primary'
    LIMIT 1
  `);
  return rows[0] || null;
}

async function accessToken(forceRefresh = false): Promise<string | null> {
  const row = await connectionRow();
  if (!row) return process.env.TINY_ACCESS_TOKEN || null;

  const expiresAt = Number(row.expires_at_ms);
  if (!forceRefresh && expiresAt > Date.now() + 60_000) {
    return decryptSecret(row.access_token_encrypted);
  }

  if (Number(row.refresh_expires_at_ms) <= Date.now()) {
    throw new Error("A autorização do Tiny expirou. Reconecte o Tiny no painel.");
  }

  const {clientId, clientSecret} = credentials();
  const tokens = await tokenRequest({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: decryptSecret(row.refresh_token_encrypted),
  });
  await saveTokens(tokens);
  return tokens.access_token;
}

async function tinyRequest(path: string, retry = true): Promise<unknown> {
  const token = await accessToken();
  if (!token) return null;
  const baseUrl = (process.env.TINY_API_BASE_URL || DEFAULT_API_URL).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {Authorization: `Bearer ${token}`, Accept: "application/json"},
    cache: "no-store",
  });
  if (response.status === 401 && retry && await connectionRow()) {
    await accessToken(true);
    return tinyRequest(path, false);
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`Tiny respondeu ${response.status} em ${path}: ${detail}`);
  }
  return response.status === 204 ? null : response.json();
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function findCost(payload: unknown): number | null {
  const root = objectValue(payload);
  const product = objectValue(root.produto);
  const rootPrices = objectValue(root.precos);
  const productPrices = objectValue(product.precos);
  const candidates = [
    root.precoCusto,
    root.preco_custo,
    root.precoCustoMedio,
    root.preco_custo_medio,
    rootPrices.precoCusto,
    rootPrices.preco_custo,
    rootPrices.precoCustoMedio,
    rootPrices.preco_custo_medio,
    product.precoCusto,
    product.preco_custo,
    product.precoCustoMedio,
    product.preco_custo_medio,
    productPrices.precoCusto,
    productPrices.preco_custo,
    productPrices.precoCustoMedio,
    productPrices.preco_custo_medio,
  ];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") continue;
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return null;
}

export async function fetchTinyCost(tinyProductId: string): Promise<number | null> {
  return findCost(await tinyRequest(`/produtos/${encodeURIComponent(tinyProductId)}`));
}

export async function fillMissingCostsFromTiny(limit = 50): Promise<{checked: number; updated: number; errors: number}> {
  if (!(await accessToken())) return {checked: 0, updated: 0, errors: 0};
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const rows = await queryRows<MissingCostRow>(`
    SELECT id, tiny_product_id
    FROM products
    WHERE cost IS NULL AND tiny_product_id IS NOT NULL AND tiny_product_id <> ''
    ORDER BY updated_at DESC
    LIMIT ${safeLimit}
  `);

  let updated = 0;
  let errors = 0;
  for (const row of rows) {
    try {
      const cost = await fetchTinyCost(String(row.tiny_product_id));
      if (cost != null) {
        await execute("UPDATE products SET cost = ?, cost_source = 'tiny' WHERE id = ? AND cost IS NULL", [cost, row.id]);
        updated += 1;
      }
    } catch {
      errors += 1;
    }
  }
  return {checked: rows.length, updated, errors};
}

export async function getTinyConnectionStatus(): Promise<{
  connected: boolean;
  mode: "oauth" | "static" | "none";
  connectedAt: string;
  needsReconnect: boolean;
}> {
  const row = await connectionRow();
  if (row) {
    return {
      connected: Number(row.refresh_expires_at_ms) > Date.now(),
      mode: "oauth",
      connectedAt: row.connected_at || "",
      needsReconnect: Number(row.refresh_expires_at_ms) <= Date.now(),
    };
  }
  if (process.env.TINY_ACCESS_TOKEN) return {connected: true, mode: "static", connectedAt: "", needsReconnect: false};
  return {connected: false, mode: "none", connectedAt: "", needsReconnect: false};
}

export async function disconnectTiny(): Promise<void> {
  if (isDatabaseConfigured()) await execute("DELETE FROM tiny_connections WHERE id = 'primary'");
}
