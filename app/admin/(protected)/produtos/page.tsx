import {BadgePercent, Calculator, Check, Search, Sparkles} from "lucide-react";
import {getAdminProducts} from "@/lib/data";
import {formatMoney} from "@/lib/utils";
import {updateProductAction} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({searchParams}: {searchParams: Promise<{q?: string; salvo?: string; erro?: string}>}) {
  const params = await searchParams;
  const products = await getAdminProducts(params.q || "");
  return <>
    <header className="admin-page-header"><div><p>Catálogo</p><h1>Produtos e preços</h1><span>O conteúdo sincroniza; preço, promoção, publicação e destaque ficam sob seu controle.</span></div></header>
    {params.salvo && <div className="notice success">Produto atualizado.</div>}
    {params.erro && <div className="notice error">{decodeURIComponent(params.erro)}</div>}
    <form className="admin-search" method="get"><Search /><input name="q" defaultValue={params.q} placeholder="Buscar por produto, SKU ou EAN" /><button type="submit">Pesquisar</button></form>
    <div className="admin-list-summary"><strong>{products.length}</strong> produtos exibidos</div>
    <section className="admin-product-list">
      {products.map((product) => {
        const margin = product.cost != null && product.salePrice != null && product.salePrice > 0
          ? ((product.salePrice - product.cost) / product.salePrice) * 100
          : null;
        return <form action={updateProductAction} className="admin-product-row" key={product.id}>
          <input type="hidden" name="id" value={product.id} />
          <div className="admin-product-identity">
            <div className="admin-product-thumb">{product.image ? <img src={product.image} alt={product.name} /> : <span>O</span>}</div>
            <div><strong>{product.name}</strong><small>{product.sku || "Sem SKU"} · {product.brand} · {product.category}</small>{!product.sourceActive && <em>Inativo na origem</em>}</div>
          </div>
          <div className="cost-box"><small>Custo importado</small><strong>{formatMoney(product.cost)}</strong><span>Fonte: {product.costSource}</span></div>
          <label>Preço de venda<input type="number" min="0" step="0.01" name="salePrice" defaultValue={product.salePrice ?? ""} placeholder="0,00" /></label>
          <label>Preço promocional<input type="number" min="0" step="0.01" name="promotionalPrice" defaultValue={product.promotionalPrice ?? ""} placeholder="Opcional" /></label>
          <label>Início promoção<input type="datetime-local" name="promotionStartsAt" defaultValue={product.promotionStartsAt} /></label>
          <label>Fim promoção<input type="datetime-local" name="promotionEndsAt" defaultValue={product.promotionEndsAt} /></label>
          <div className="commercial-summary">
            <span><Calculator />Margem</span><strong>{margin == null ? "-" : `${margin.toFixed(1)}%`}</strong>
            {product.promotionalPrice != null && <small><BadgePercent />Promoção configurada</small>}
          </div>
          <div className="toggle-stack">
            <label className="switch-label"><input type="checkbox" name="published" defaultChecked={product.published} disabled={!product.sourceActive} /><span />Publicado</label>
            <label className="switch-label"><input type="checkbox" name="featured" defaultChecked={product.featured} /><span />Destaque <Sparkles /></label>
          </div>
          <button className="save-row-button" type="submit"><Check />Salvar</button>
        </form>;
      })}
      {products.length === 0 && <div className="empty-admin-state">Nenhum produto encontrado.</div>}
    </section>
  </>;
}
