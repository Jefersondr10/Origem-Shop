"use client";

import {usePathname} from "next/navigation";
import {Clock3, Instagram, MapPin, MessageCircle} from "lucide-react";
import {CartDrawer} from "@/components/CartDrawer";
import {SiteHeader} from "@/components/SiteHeader";
import type {CatalogSettings} from "@/lib/types";
import {normalizePhone} from "@/lib/utils";

export function AppChrome({settings, children}: {settings: CatalogSettings; children: React.ReactNode}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  const instagramHref = settings.instagram
    ? (settings.instagram.startsWith("http") ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, "")}`)
    : "";
  const whatsapp = normalizePhone(settings.whatsapp);
  return <>
    <SiteHeader settings={settings} />
    {children}
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div><div className="brand-mark">{settings.logoUrl ? <img src={settings.logoUrl} alt={settings.catalogName} /> : <span>O</span>}<strong>{settings.catalogName}</strong></div><p>{settings.footerText || "Tecnologia, variedade e atendimento direto."}</p></div>
        <div className="footer-links"><strong>Atendimento</strong>{whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle />WhatsApp</a>}{instagramHref && <a href={instagramHref} target="_blank" rel="noreferrer"><Instagram />Instagram</a>}{settings.address && <a href={settings.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer"><MapPin />{settings.address}</a>}{settings.businessHours && <span><Clock3 />{settings.businessHours}</span>}</div>
        <div className="footer-links"><strong>Catálogo</strong><a href="/#produtos">Produtos</a><a href="/#categorias">Categorias</a><a href="/#marcas">Marcas</a><a href="/admin">Painel gerencial</a></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} {settings.catalogName}</span><span>Catálogo informativo. Confirmação de disponibilidade pelo atendimento.</span></div>
    </footer>
    <CartDrawer settings={settings} />
  </>;
}
