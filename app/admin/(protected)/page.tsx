import {AlertTriangle, BadgePercent, Boxes, CircleDollarSign, Eye, EyeOff, ImageOff, RefreshCw, Sparkles, Tags, ListTree} from "lucide-react";
import {getAdminDashboard} from "@/lib/data";
import {runSyncAction} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({searchParams}: {searchParams: Promise<Record<string, string | undefined>>}) {
  const [dashboard, params] = await Promise.all([getAdminDashboard(), searchParams]);
  const cards = [
    {label: "Produtos cadastrados", value: dashboard.totalProducts, icon: Boxes},
    {label: "Publicados", value: dashboard.publishedProducts, icon: Eye},
    {label: "Ocultos", value: dashboard.hiddenProducts, icon: EyeOff},
    {label: "Sem preço", value: dashboard.withoutPrice, icon: CircleDollarSign},
    {label: "Sem custo", value: dashboard.withoutCost, icon: AlertTriangle},
    {label: "Sem foto", value: dashboard.withoutImage, icon: ImageOff},
    {label: "Sem marca", value: dashboard.withoutBrand, icon: Tags},
    {label: "Sem categoria", value: dashboard.withoutCategory, icon: ListTree},
    {label: "Destaques", value: dashboard.featured, icon: Sparkles},
    {label: "Promoções", value: dashboard.promotions, icon: BadgePercent},
  ];

  return <>
    <header className="admin-page-header"><div><p>Painel gerencial</p><h1>Visão geral</h1><span>Acompanhe o catálogo e execute a importação do sistema de mídia.</span></div><form action={runSyncAction}><button className="primary-button" type="submit"><RefreshCw />Sincronizar agora</button></form></header>
    {params.sync === "ok" && <div className="notice success">Sincronização concluída: {params.produtos || 0} produtos processados e {params.custos || 0} custos recuperados no Tiny.</div>}
    {params.sync === "erro" && <div className="notice error">Falha na sincronização: {params.mensagem || "verifique as configurações"}</div>}
    <section className="metric-grid">{cards.map(({label, value, icon: Icon}) => <article key={label}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>
    <section className="admin-two-columns">
      <article className="admin-panel"><div className="admin-panel-heading"><div><p>Integração</p><h2>Última sincronização</h2></div></div>{dashboard.lastSync ? <dl className="status-list"><div><dt>Status</dt><dd className={`status-pill ${dashboard.lastSync.status}`}>{dashboard.lastSync.status}</dd></div><div><dt>Início</dt><dd>{dashboard.lastSync.startedAt || "-"}</dd></div><div><dt>Fim</dt><dd>{dashboard.lastSync.finishedAt || "-"}</dd></div><div><dt>Resultado</dt><dd><code>{JSON.stringify(dashboard.lastSync.stats)}</code></dd></div>{dashboard.lastSync.errorMessage && <div><dt>Erro</dt><dd>{dashboard.lastSync.errorMessage}</dd></div>}</dl> : <div className="empty-admin-state">Nenhuma sincronização registrada.</div>}</article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p>Importação inicial</p><h2>Sincronização completa</h2></div></div><p>Use apenas na primeira carga ou quando precisar reprocessar todos os produtos. Preços, promoções, destaques e logos manuais não serão sobrescritos.</p><form action={runSyncAction}><input type="hidden" name="full" value="1" /><button className="secondary-button" type="submit"><RefreshCw />Executar carga completa</button></form></article>
    </section>
  </>;
}
