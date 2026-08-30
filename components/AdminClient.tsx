"use client";

import {useMemo, useState} from "react";
import type {CatalogProduct, CatalogSettings} from "@/lib/types";

type GenericRow = Record<string, unknown>;
type Props = {
  products: CatalogProduct[];
  settings: CatalogSettings;
  stats: Record<string, number>;
  payment: {machines: GenericRow[]; brands: GenericRow[]; rates: GenericRow[]};
  syncRuns: GenericRow[];
  tinyStatus: {connected: boolean; expiresAt: string | null};
};

const currency = new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"});

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {headers: {"Content-Type": "application/json", ...(init?.headers || {})}, ...init});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Operação não concluída");
  return data;
}

export default function AdminClient({products, settings: initialSettings, stats, payment, syncRuns, tinyStatus}: Props) {
  const [tab, setTab] = useState<"dashboard" | "products" | "settings" | "payments" | "sync">("dashboard");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [machine, setMachine] = useState({name: "", publicName: ""});
  const [brand, setBrand] = useState({name: "", logoUrl: ""});
  const [rate, setRate] = useState({machineId: "", brandId: "", installments: "1", percentageRate: "0", fixedRate: "0", minimumAmount: "0", passFeeToCustomer: true});

  const visibleProducts = useMemo(() => {
    const term = search.toLocaleLowerCase("pt-BR");
    return products.filter((product) => `${product.name} ${product.sku} ${product.ean || ""}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [products, search]);

  async function saveProduct(product: CatalogProduct, fields: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try {
      await api("/api/admin/products", {method: "PATCH", body: JSON.stringify({id: product.id, ...fields})});
      setMessage(`Produto ${product.sku} atualizado.`);
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erro"); } finally { setBusy(false); }
  }

  async function saveSettings() {
    setBusy(true); setMessage("");
    try { await api("/api/admin/settings", {method: "PUT", body: JSON.stringify(settings)}); setMessage("Configurações salvas."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Erro"); } finally { setBusy(false); }
  }

  async function addPayment(kind: "machine" | "brand" | "rate", payload: unknown) {
    setBusy(true); setMessage("");
    try { await api("/api/admin/payment", {method: "POST", body: JSON.stringify({kind, payload})}); window.location.reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Erro"); setBusy(false); }
  }

  async function synchronize(full: boolean) {
    setBusy(true); setMessage("Sincronização iniciada…");
    try {
      const result = await api("/api/admin/sync", {method: "POST", body: JSON.stringify({full})});
      setMessage(`Concluído: ${result.summary.processed} processados, ${result.summary.created} criados, ${result.summary.updated} atualizados.`);
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erro"); setBusy(false); }
  }

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-logo" href="/admin"><span>O</span><b>Origem</b></a><nav>{([ ["dashboard", "◫", "Visão geral"], ["products", "▦", "Produtos e preços"], ["settings", "⚙", "Configurações"], ["payments", "▤", "Parcelamento"], ["sync", "↻", "Integrações"] ] as const).map(([key, icon, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><span>{icon}</span>{label}</button>)}</nav><div><a href="/" target="_blank">Abrir catálogo ↗</a><button onClick={() => api("/api/admin/logout", {method: "POST"}).then(() => location.href = "/admin/login")}>Sair</button></div></aside>
    <main className="admin-main"><header><div><span className="eyebrow">PAINEL GERENCIAL</span><h1>{tab === "dashboard" ? "Visão geral" : tab === "products" ? "Produtos e preços" : tab === "settings" ? "Configurações" : tab === "payments" ? "Parcelamento" : "Integrações"}</h1></div><span className="status-dot">● Sistema ativo</span></header>{message && <div className="admin-message">{message}</div>}

      {tab === "dashboard" && <><div className="stat-grid"><article><span>Produtos</span><strong>{stats.total || 0}</strong><small>{stats.active || 0} publicados</small></article><article><span>Sem preço</span><strong>{stats.withoutPrice || 0}</strong><small>exigem atenção</small></article><article><span>Sem custo</span><strong>{stats.withoutCost || 0}</strong><small>pendentes do Tiny</small></article><article><span>Promoções</span><strong>{stats.promotions || 0}</strong><small>{stats.featured || 0} destaques</small></article></div><section className="admin-panel"><div className="panel-heading"><div><h2>Saúde do catálogo</h2><p>Itens que precisam ser corrigidos antes de vender.</p></div></div><div className="health-list"><div><span>Preço de venda</span><b className={stats.withoutPrice ? "warn" : "ok"}>{stats.withoutPrice ? `${stats.withoutPrice} pendente(s)` : "Tudo certo"}</b></div><div><span>Custo importado</span><b className={stats.withoutCost ? "warn" : "ok"}>{stats.withoutCost ? `${stats.withoutCost} pendente(s)` : "Tudo certo"}</b></div><div><span>Integração Tiny</span><b className={tinyStatus.connected ? "ok" : "warn"}>{tinyStatus.connected ? "Conectado" : "Não conectado"}</b></div></div></section></>}

      {tab === "products" && <section className="admin-panel wide"><div className="panel-heading"><div><h2>Gestão comercial</h2><p>Custo é informativo. Preço, promoção e destaque ficam sob seu controle.</p></div><input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, SKU ou EAN" /></div><div className="product-table"><div className="table-row table-head"><span>Produto</span><span>Custo</span><span>Preço</span><span>Promoção</span><span>Destaque</span><span>Publicado</span><span></span></div>{visibleProducts.map((product) => <ProductAdminRow key={product.id} product={product} busy={busy} onSave={saveProduct} />)}</div></section>}

      {tab === "settings" && <section className="admin-panel form-panel"><div className="panel-heading"><div><h2>Identidade e contato</h2><p>Dados exibidos no catálogo e usados na finalização do pedido.</p></div></div><div className="form-grid"><label>Nome do catálogo<input value={settings.catalogName} onChange={(e) => setSettings({...settings, catalogName: e.target.value})}/></label><label>Slogan<input value={settings.catalogTagline} onChange={(e) => setSettings({...settings, catalogTagline: e.target.value})}/></label><label>URL da logo<input value={settings.catalogLogoUrl} onChange={(e) => setSettings({...settings, catalogLogoUrl: e.target.value})}/></label><label>WhatsApp<input value={settings.whatsappNumber} onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} placeholder="5561999999999"/></label><label>Instagram<input value={settings.instagramHandle} onChange={(e) => setSettings({...settings, instagramHandle: e.target.value})}/></label><label>Link do mapa<input value={settings.mapUrl} onChange={(e) => setSettings({...settings, mapUrl: e.target.value})}/></label><label className="full">Endereço<input value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})}/></label><label className="full">Mensagem padrão do WhatsApp<textarea value={settings.whatsappMessage} onChange={(e) => setSettings({...settings, whatsappMessage: e.target.value})}/></label><label>Horário de atendimento<input value={settings.businessHours} onChange={(e) => setSettings({...settings, businessHours: e.target.value})}/></label><label>Máximo de parcelas<input type="number" value={settings.maxInstallments} onChange={(e) => setSettings({...settings, maxInstallments: Number(e.target.value)})}/></label><label className="check"><input type="checkbox" checked={settings.showMachineName} onChange={(e) => setSettings({...settings, showMachineName: e.target.checked})}/> Mostrar nome da máquina ao público</label></div><button className="admin-primary" disabled={busy} onClick={saveSettings}>Salvar configurações</button></section>}

      {tab === "payments" && <div className="admin-columns"><section className="admin-panel form-panel"><h2>Máquinas</h2><label>Nome interno<input value={machine.name} onChange={(e) => setMachine({...machine, name: e.target.value})}/></label><label>Nome público opcional<input value={machine.publicName} onChange={(e) => setMachine({...machine, publicName: e.target.value})}/></label><button className="admin-primary" disabled={busy || !machine.name} onClick={() => addPayment("machine", machine)}>Adicionar máquina</button><div className="chip-list">{payment.machines.map((row) => <span key={String(row.id)}>{String(row.name)}</span>)}</div></section><section className="admin-panel form-panel"><h2>Bandeiras</h2><label>Nome<input value={brand.name} onChange={(e) => setBrand({...brand, name: e.target.value})}/></label><label>URL da logo<input value={brand.logoUrl} onChange={(e) => setBrand({...brand, logoUrl: e.target.value})}/></label><button className="admin-primary" disabled={busy || !brand.name} onClick={() => addPayment("brand", brand)}>Adicionar bandeira</button><div className="chip-list">{payment.brands.map((row) => <span key={String(row.id)}>{String(row.name)}</span>)}</div></section><section className="admin-panel form-panel full-width"><h2>Nova taxa</h2><div className="form-grid"><label>Máquina<select value={rate.machineId} onChange={(e) => setRate({...rate, machineId: e.target.value})}><option value="">Selecione</option>{payment.machines.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}</select></label><label>Bandeira<select value={rate.brandId} onChange={(e) => setRate({...rate, brandId: e.target.value})}><option value="">Selecione</option>{payment.brands.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}</select></label><label>Parcelas<input type="number" min="1" max="24" value={rate.installments} onChange={(e) => setRate({...rate, installments: e.target.value})}/></label><label>Taxa %<input type="number" step="0.0001" value={rate.percentageRate} onChange={(e) => setRate({...rate, percentageRate: e.target.value})}/></label><label>Taxa fixa<input type="number" step="0.01" value={rate.fixedRate} onChange={(e) => setRate({...rate, fixedRate: e.target.value})}/></label><label>Valor mínimo<input type="number" step="0.01" value={rate.minimumAmount} onChange={(e) => setRate({...rate, minimumAmount: e.target.value})}/></label><label className="check"><input type="checkbox" checked={rate.passFeeToCustomer} onChange={(e) => setRate({...rate, passFeeToCustomer: e.target.checked})}/> Repassar taxa ao cliente</label></div><button className="admin-primary" disabled={busy || !rate.machineId || !rate.brandId} onClick={() => addPayment("rate", rate)}>Salvar taxa</button><div className="rates-table">{payment.rates.map((row) => <div key={String(row.id)}><span>{String(row.machine_name)} · {String(row.brand_name)}</span><b>{String(row.installments)}x</b><span>{Number(row.percentage_rate).toFixed(4)}% + {currency.format(Number(row.fixed_rate))}</span></div>)}</div></section></div>}

      {tab === "sync" && <div className="admin-columns"><section className="admin-panel"><h2>Sistema de mídia</h2><p>Importa nomes, SKUs, EANs, marcas, categorias, descrições, fotos, especificações, logos e custo.</p><div className="button-row"><button className="admin-primary" disabled={busy} onClick={() => synchronize(false)}>Sincronização incremental</button><button className="admin-secondary" disabled={busy} onClick={() => synchronize(true)}>Sincronização completa</button></div></section><section className="admin-panel"><h2>Tiny / Olist</h2><p>Usado somente quando o sistema de mídia não entregar custo. O preço de venda do Tiny não é importado.</p><a className="admin-primary link-button" href="/api/tiny/connect">{tinyStatus.connected ? "Reconectar Tiny" : "Conectar Tiny"}</a></section><section className="admin-panel full-width"><h2>Histórico</h2><div className="sync-list">{syncRuns.map((run) => <div key={String(run.id)}><b>{String(run.status)}</b><span>{String(run.mode)} · {String(run.processed_count)} processados · {String(run.error_count)} erros</span><small>{new Date(String(run.started_at)).toLocaleString("pt-BR")}</small></div>)}</div></section></div>}
    </main>
  </div>;
}

function ProductAdminRow({product, busy, onSave}: {product: CatalogProduct; busy: boolean; onSave: (product: CatalogProduct, fields: Record<string, unknown>) => void}) {
  const [salePrice, setSalePrice] = useState(String(product.salePrice || ""));
  const [promotionalPrice, setPromotionalPrice] = useState(String(product.promotionalPrice || ""));
  const [featured, setFeatured] = useState(product.featured);
  const [active, setActive] = useState(product.active);
  return <div className="table-row"><span><b>{product.name}</b><small>{product.sku}</small></span><span>{product.cost ? currency.format(product.cost) : <em>Pendente</em>}</span><span><input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)}/></span><span><input type="number" step="0.01" value={promotionalPrice} onChange={(e) => setPromotionalPrice(e.target.value)}/></span><span><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}/></span><span><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}/></span><span><button disabled={busy} onClick={() => onSave(product, {salePrice: Number(salePrice) || null, promotionalPrice: Number(promotionalPrice) || null, featured, active})}>Salvar</button></span></div>;
}
