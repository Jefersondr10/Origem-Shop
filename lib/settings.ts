import {databaseConfigured, dbExecute, dbQuery} from "./db";
import type {CatalogSettings} from "./types";

const defaults: CatalogSettings = {
  catalogName: "Origem",
  catalogTagline: "Tecnologia com procedência e preço direto.",
  catalogLogoUrl: "",
  whatsappNumber: "",
  whatsappMessage: "Olá! Tenho interesse nos produtos abaixo:",
  instagramHandle: "",
  address: "",
  mapUrl: "",
  businessHours: "",
  footerText: "Origem — catálogo de produtos.",
  maxInstallments: 12,
  showMachineName: false,
};

const keys: Record<keyof CatalogSettings, string> = {
  catalogName: "catalog_name",
  catalogTagline: "catalog_tagline",
  catalogLogoUrl: "catalog_logo_url",
  whatsappNumber: "whatsapp_number",
  whatsappMessage: "whatsapp_message",
  instagramHandle: "instagram_handle",
  address: "address",
  mapUrl: "map_url",
  businessHours: "business_hours",
  footerText: "footer_text",
  maxInstallments: "max_installments",
  showMachineName: "show_machine_name",
};

type SettingRow = {setting_key: string; setting_value: string | null};

export async function getSettings(): Promise<CatalogSettings> {
  if (!databaseConfigured()) return defaults;
  const rows = await dbQuery<SettingRow>("SELECT setting_key, setting_value FROM settings");
  const values = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value || ""]));
  return {
    catalogName: values.catalog_name || defaults.catalogName,
    catalogTagline: values.catalog_tagline || defaults.catalogTagline,
    catalogLogoUrl: values.catalog_logo_url || "",
    whatsappNumber: values.whatsapp_number || "",
    whatsappMessage: values.whatsapp_message || defaults.whatsappMessage,
    instagramHandle: values.instagram_handle || "",
    address: values.address || "",
    mapUrl: values.map_url || "",
    businessHours: values.business_hours || "",
    footerText: values.footer_text || defaults.footerText,
    maxInstallments: Math.max(1, Math.min(24, Number(values.max_installments || 12))),
    showMachineName: values.show_machine_name === "true",
  };
}

export async function updateSettings(input: Partial<CatalogSettings>) {
  if (!databaseConfigured()) throw new Error("Banco não configurado");
  for (const [property, value] of Object.entries(input) as [keyof CatalogSettings, unknown][]) {
    const settingKey = keys[property];
    if (!settingKey) continue;
    await dbExecute(
      "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
      [settingKey, String(value ?? "")],
    );
  }
  return getSettings();
}
