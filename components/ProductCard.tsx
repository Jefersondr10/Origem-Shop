import Link from "next/link";
import {BadgePercent, Sparkles} from "lucide-react";
import type {CatalogSettings, PublicProduct} from "@/lib/types";
import {formatMoney} from "@/lib/utils";
import {ProductActions} from "@/components/ProductActions";

export function ProductCard({product, settings}: {product: PublicProduct; settings: CatalogSettings}) {
  return <article className="product-card">
    <Link href={`/produto/${product.slug}`} className="product-image-wrap">
      {product.images[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" /> : <div className="image-placeholder">ORIGEM</div>}
      <div className="product-badges">
        {product.promotionActive && <span className="badge promo"><BadgePercent />Promoção</span>}
        {product.featured && <span className="badge featured"><Sparkles />Destaque</span>}
      </div>
    </Link>
    <div className="product-card-body">
      <div className="product-meta"><span>{product.brand}</span><span>{product.category}</span></div>
      <Link href={`/produto/${product.slug}`}><h3>{product.name}</h3></Link>
      {product.shortDescription && <p>{product.shortDescription}</p>}
      <div className="price-block">
        {product.promotionActive && product.salePrice != null && <del>{formatMoney(product.salePrice)}</del>}
        <strong>{formatMoney(product.effectivePrice)}</strong>
        {product.effectivePrice != null && <small>Preço unitário</small>}
      </div>
      <ProductActions product={product} settings={settings} />
    </div>
  </article>;
}
