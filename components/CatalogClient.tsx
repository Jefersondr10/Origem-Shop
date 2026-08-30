"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {ArrowRight, BadgePercent, Boxes, Search, Sparkles, Tags, X} from "lucide-react";
import {ProductCard} from "@/components/ProductCard";
import type {CatalogFacet, CatalogSettings, PublicProduct} from "@/lib/types";
import {formatMoney} from "@/lib/utils";

function normalized(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function CatalogClient({products, brands, categories, settings}: {products: PublicProduct[]; brands: CatalogFacet[]; categories: CatalogFacet[]; settings: CatalogSettings}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [promotionsOnly, setPromotionsOnly] = useState(false);
  const featured = products.find((product) => product.featured) || products[0];

  const filtered = useMemo(() => {
    const needle = normalized(query.trim());
    return products.filter((product) => {
      const haystack = normalized(`${product.name} ${product.sku} ${product.ean} ${product.brand} ${product.category}`);
      return (!needle || haystack.includes(needle))
        && (!brand || product.brandSlug === brand)
        && (!category || product.categorySlug === category)
        && (!promotionsOnly || product.promotionActive);
    });
  }, [products, query, brand, category, promotionsOnly]);

  const clearFilters = () => { setQuery(""); setBrand(""); setCategory(""); setPromotionsOnly(false); };
  const hasFilters = Boolean(query || brand || category || promotionsOnly);

  return <main>
    <section className="hero-section">
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      <div className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles />Tecnologia com origem confiável</p>
          <h1>Produtos certos. <span>Negócio mais rápido.</span></h1>
          <p>Explore marcas, categorias, promoções e condições de parcelamento em um catálogo direto, sem labirinto de e-commerce.</p>
          <label className="hero-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por produto, marca, SKU ou EAN" /><a href="#produtos">Buscar</a></label>
          <div className="hero-stats">
            <a href="#produtos"><strong>{products.length}</strong><span>produtos publicados</span></a>
            <a href="#marcas"><strong>{brands.length}</strong><span>marcas organizadas</span></a>
            <a href="#promocoes"><strong>{products.filter((product) => product.promotionActive).length}</strong><span>promoções ativas</span></a>
          </div>
        </div>
        {featured && <Link href={`/produto/${featured.slug}`} className="hero-product-card">
          <div className="hero-product-visual">{featured.images[0] ? <img src={featured.images[0]} alt={featured.name} /> : <div className="image-placeholder">ORIGEM</div>}<span>{featured.promotionActive ? "Oferta selecionada" : "Destaque da Origem"}</span></div>
          <div><small>{featured.brand} · {featured.category}</small><h2>{featured.name}</h2><strong>{formatMoney(featured.effectivePrice)}</strong><em>Ver produto <ArrowRight /></em></div>
        </Link>}
      </div>
    </section>

    <section id="categorias" className="shell discovery-block">
      <div className="section-heading"><div><p><Boxes />Categorias</p><h2>Encontre pelo tipo de produto</h2></div><a href="#produtos">Ver catálogo <ArrowRight /></a></div>
      <div className="category-strip">
        {categories.slice(0, 12).map((item, index) => <button key={item.slug} type="button" className={category === item.slug ? "active" : ""} onClick={() => {setCategory(category === item.slug ? "" : item.slug); location.hash = "produtos";}}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><small>{item.count} produtos</small></button>)}
      </div>
    </section>

    <section id="marcas" className="brand-section">
      <div className="shell">
        <div className="section-heading"><div><p><Tags />Marcas</p><h2>Navegue pelas marcas do catálogo</h2></div></div>
        <div className="brand-grid">
          {brands.slice(0, 16).map((item) => <button key={item.slug} type="button" className={brand === item.slug ? "active" : ""} onClick={() => {setBrand(brand === item.slug ? "" : item.slug); location.hash = "produtos";}}>{item.logoUrl ? <img src={item.logoUrl} alt={item.name} /> : <strong>{item.name}</strong>}<small>{item.count}</small></button>)}
        </div>
      </div>
    </section>

    <section id="produtos" className="shell products-block">
      <div className="section-heading products-heading"><div><p><Boxes />Catálogo</p><h2>{hasFilters ? "Resultados filtrados" : "Todos os produtos"}</h2><span>{filtered.length} produto{filtered.length === 1 ? "" : "s"}</span></div><button id="promocoes" type="button" className={promotionsOnly ? "promotion-filter active" : "promotion-filter"} onClick={() => setPromotionsOnly((value) => !value)}><BadgePercent />Somente promoções</button></div>
      <div className="catalog-toolbar">
        <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar no catálogo" />{query && <button type="button" onClick={() => setQuery("")}><X /></button>}</label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>)}</select>
        <select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="">Todas as marcas</option>{brands.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>)}</select>
        {hasFilters && <button className="clear-filters" type="button" onClick={clearFilters}><X />Limpar</button>}
      </div>
      {filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} settings={settings} />)}</div> : <div className="empty-results"><Search /><h3>Nenhum produto encontrado</h3><p>Remova algum filtro ou tente outro termo.</p><button type="button" onClick={clearFilters}>Limpar filtros</button></div>}
    </section>
  </main>;
}
