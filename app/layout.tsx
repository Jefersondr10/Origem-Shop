import type {Metadata} from "next";
import {CartProvider} from "@/components/CartProvider";
import {AppChrome} from "@/components/AppChrome";
import {getCatalogSettings} from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: {default: "Origem", template: "%s | Origem"},
  description: "Catálogo Origem: produtos, marcas, condições de parcelamento e atendimento direto pelo WhatsApp.",
  icons: {icon: "/origem-icon.svg", apple: "/origem-icon.svg"},
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const settings = await getCatalogSettings();
  return <html lang="pt-BR"><body><CartProvider><AppChrome settings={settings}>{children}</AppChrome></CartProvider></body></html>;
}
