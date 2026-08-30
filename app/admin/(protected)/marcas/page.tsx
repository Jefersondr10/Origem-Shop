import {Image, Save, Tags} from "lucide-react";
import {getAdminBrands} from "@/lib/data";
import {updateBrandLogoAction} from "./actions";

export const dynamic = "force-dynamic";

export default async function BrandsAdminPage({searchParams}: {searchParams: Promise<{salvo?: string; erro?: string}>}) {
  const [brands, params] = await Promise.all([getAdminBrands(), searchParams]);
  return <>
    <header className="admin-page-header"><div><p>Identidade visual</p><h1>Marcas e logos</h1><span>A logo importada é atualizada pelo sistema de mídia. A logo manual tem prioridade e não é sobrescrita.</span></div></header>
    {params.salvo && <div className="notice success">Logo da marca atualizada.</div>}
    {params.erro && <div className="notice error">{decodeURIComponent(params.erro)}</div>}
    <section className="brand-admin-grid">
      {brands.map((brand) => <form action={updateBrandLogoAction} className="admin-panel brand-admin-card" key={brand.id}>
        <input type="hidden" name="id" value={brand.id} />
        <div className="brand-admin-preview">{brand.effectiveLogoUrl ? <img src={brand.effectiveLogoUrl} alt={brand.name} /> : <span><Tags /></span>}</div>
        <div className="brand-admin-copy"><h2>{brand.name}</h2><p>{brand.productCount} produto{brand.productCount === 1 ? "" : "s"}</p><small>{brand.sourceLogoUrl ? "Logo disponível na fonte" : "A fonte ainda não enviou logo"}</small></div>
        <label><Image />URL de logo manual<input name="logoUrl" type="url" defaultValue={brand.manualLogoUrl} placeholder="https://..." /></label>
        <p className="field-help">Deixe vazio para voltar a usar a logo importada.</p>
        <button className="secondary-button" type="submit"><Save />Salvar</button>
      </form>)}
      {brands.length === 0 && <div className="empty-admin-state">As marcas aparecerão após a primeira sincronização.</div>}
    </section>
  </>;
}
