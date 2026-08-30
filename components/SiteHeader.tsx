"use client";

import Link from "next/link";
import {Instagram, MapPin, Menu, MessageCircle, ShoppingCart, X} from "lucide-react";
import {useState} from "react";
import {useCart} from "@/components/CartProvider";
import type {CatalogSettings} from "@/lib/types";
import {normalizePhone} from "@/lib/utils";

export function SiteHeader({settings}: {settings: CatalogSettings}) {
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const instagramHref = settings.instagram
    ? (settings.instagram.startsWith("http") ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, "")}`)
    : "";
  const whatsapp = normalizePhone(settings.whatsapp);

  return <header className="site-header">
    <div className="site-topbar">
      <div className="shell topbar-inner">
        <span>Catálogo atualizado e atendimento direto</span>
        <div>
          {settings.address && <a href={settings.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer"><MapPin />{settings.address}</a>}
          {instagramHref && <a href={instagramHref} target="_blank" rel="noreferrer"><Instagram />{settings.instagram}</a>}
          {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle />WhatsApp</a>}
        </div>
      </div>
    </div>
    <div className="shell nav-row">
      <Link href="/" className="brand-mark" aria-label="Página inicial">
        {settings.logoUrl ? <img src={settings.logoUrl} alt={settings.catalogName} /> : <span>O</span>}
        <strong>{settings.catalogName}</strong>
      </Link>
      <nav className={menuOpen ? "main-nav open" : "main-nav"}>
        <Link href="/#produtos" onClick={() => setMenuOpen(false)}>Produtos</Link>
        <Link href="/#categorias" onClick={() => setMenuOpen(false)}>Categorias</Link>
        <Link href="/#marcas" onClick={() => setMenuOpen(false)}>Marcas</Link>
        <Link href="/#promocoes" onClick={() => setMenuOpen(false)}>Promoções</Link>
        <Link href="/admin" onClick={() => setMenuOpen(false)}>Gerencial</Link>
      </nav>
      <div className="header-actions">
        <button className="icon-button cart-button" type="button" onClick={cart.openCart} aria-label="Abrir carrinho">
          <ShoppingCart />
          {cart.count > 0 && <b>{cart.count}</b>}
        </button>
        <button className="icon-button mobile-menu" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </div>
  </header>;
}
