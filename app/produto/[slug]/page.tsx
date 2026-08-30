import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import sanitizeHtml from "sanitize-html";
import {ChevronRight, PackageCheck} from "lucide-react";
import {ProductActions} from "@/components/ProductActions";
import {getCatalogSettings, getPublicProductBySlug} from "@/lib/data";
import {formatMoney} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const product = await getPublicProductBySlug((await params).slug);
  return product ? {title: product.name, description: product.shortDescription || `${product.name} no catálogo Origem.`} : {title: "Produto"};
}

export default async function ProductPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const [product, settings] = await Promise.all([getPublicProductBySlug(slug), getCatalogSettings()]);
  if (!product) notFound();
  const safeDescription = sanitizeHtml(product.descriptionHtml, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "h2", "h3", "h4", "table", "tbody", "thead", "tr", "td", "th"],
    allowedAttributes: {},
  });
  const attributes = Object.entries(product.attributes);

  return <main className="product-page shell">
    <nav className="breadcrumbs"><Link href="/">Início</Link><ChevronRight /><a href={`/#produtos`}>{product.category}</a><ChevronRight /><span>{product.name}</span></nav>
    <section className="product-detail">
      <div className="product-gallery">
        <div className="product-main-image">{product.images[0] ? <img src={product.images[0]} alt={product.name} /> : <div className="image-placeholder">ORIGEM</div>}</div>
        {product.images.length > 1 && <div className="product-thumbnails">{product.images.slice(0, 6).map((image, index) => <div key={`${image}-${index}`}><img src={image} alt={`${product.name} ${index + 1}`} /></div>)}</div>}
      </div>
      <div className="product-summary">
        <div className="product-meta"><span>{product.brand}</span><span>{product.category}</span></div>
        <h1>{product.name}</h1>
        {product.sku && <p className="product-sku">SKU: {product.sku}</p>}
        {product.shortDescription && <p className="product-lead">{product.shortDescription}</p>}
        <div className="detail-price">{product.promotionActive && product.salePrice != null && <del>{formatMoney(product.salePrice)}</del>}<strong>{formatMoney(product.effectivePrice)}</strong>{product.promotionActive && <span>Preço promocional</span>}</div>
        <div className="availability"><PackageCheck /><div><strong>Disponível para atendimento</strong><span>Confirme quantidade e prazo diretamente no WhatsApp.</span></div></div>
        <ProductActions product={product} settings={settings} large />
      </div>
    </section>
    {(safeDescription || attributes.length > 0) && <section className="product-information">
      {safeDescription && <article><p className="section-kicker">Descrição</p><h2>Sobre o produto</h2><div className="rich-text" dangerouslySetInnerHTML={{__html: safeDescription}} /></article>}
      {attributes.length > 0 && <aside><p className="section-kicker">Especificações</p><h2>Detalhes técnicos</h2><dl>{attributes.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value ?? "-")}</dd></div>)}</dl></aside>}
    </section>}
  </main>;
}
