import {Database, Instagram, Link2, MapPin, MessageCircle, RefreshCw, Save, ShieldCheck, Store, Unplug} from "lucide-react";
import {getCatalogSettings, getPaymentAdminData} from "@/lib/data";
import {getTinyConnectionStatus, tinyRedirectUri} from "@/lib/tiny";
import {disconnectTinyAction, updateSettingsAction} from "./actions";

export const dynamic = "force-dynamic";

type Params = {salvo?: string; erro?: string; tiny?: string; mensagem?: string};

function tinyLabel(status: Awaited<ReturnType<typeof getTinyConnectionStatus>>): string {
  if (status.needsReconnect) return "Reconexão necessária";
  if (status.mode === "oauth" && status.connected) return "Conectado por OAuth";
  if (status.mode === "static" && status.connected) return "Token estático ativo";
  return "Opcional / pendente";
}

export default async function SettingsPage({searchParams}: {searchParams: Promise<Params>}) {
  const [settings, payment, tiny, params] = await Promise.all([
    getCatalogSettings(),
    getPaymentAdminData(),
    getTinyConnectionStatus(),
    searchParams,
  ]);

  let callbackUrl = "Configure NEXT_PUBLIC_SITE_URL para gerar a URL de retorno.";
  try {
    callbackUrl = tinyRedirectUri();
  } catch {
    // A própria mensagem acima orienta a configuração ausente.
  }

  return <>
    <header className="admin-page-header"><div><p>Operação</p><h1>Configurações do catálogo</h1><span>Edite os dados públicos, o atendimento, o parcelamento e as integrações.</span></div></header>
    {params.salvo && <div className="notice success">Configurações atualizadas.</div>}
    {params.erro && <div className="notice error">{params.erro}</div>}
    {params.tiny === "ok" && <div className="notice success">Tiny conectado. Os tokens serão renovados automaticamente enquanto a autorização permanecer válida.</div>}
    {params.tiny === "desconectado" && <div className="notice success">Tiny desconectado deste catálogo.</div>}
    {params.tiny === "erro" && <div className="notice error">{params.mensagem || "Falha ao conectar o Tiny."}</div>}

    <form action={updateSettingsAction} className="settings-form">
      <section className="admin-panel form-section"><div className="admin-panel-heading"><span><Store /></span><div><p>Identidade</p><h2>Nome e logo da Origem</h2></div></div><div className="form-grid two"><label>Nome do catálogo<input name="catalogName" defaultValue={settings.catalogName} required /></label><label>URL da logo principal<input name="logoUrl" type="url" defaultValue={settings.logoUrl} placeholder="https://..." /></label></div><p className="field-help">A logo principal é independente das logos das marcas.</p></section>

      <section className="admin-panel form-section"><div className="admin-panel-heading"><span><MessageCircle /></span><div><p>Contato</p><h2>WhatsApp e Instagram</h2></div></div><div className="form-grid two"><label><MessageCircle />Número do WhatsApp<input name="whatsapp" defaultValue={settings.whatsapp} placeholder="55 61 99999-9999" /></label><label><Instagram />Instagram<input name="instagram" defaultValue={settings.instagram} placeholder="@origem" /></label></div><label>Mensagem padrão do WhatsApp<textarea name="whatsappMessageTemplate" defaultValue={settings.whatsappMessageTemplate} rows={3} /></label></section>

      <section className="admin-panel form-section"><div className="admin-panel-heading"><span><MapPin /></span><div><p>Localização</p><h2>Endereço e atendimento</h2></div></div><div className="form-grid two"><label>Endereço<textarea name="address" defaultValue={settings.address} rows={3} /></label><label>Link do mapa<input name="mapsUrl" type="url" defaultValue={settings.mapsUrl} placeholder="https://maps..." /></label><label>Horários de atendimento<input name="businessHours" defaultValue={settings.businessHours} placeholder="Seg. a sáb., 9h às 18h" /></label><label>Texto do rodapé<input name="footerText" defaultValue={settings.footerText} /></label></div></section>

      <section className="admin-panel form-section"><div className="admin-panel-heading"><span><ShieldCheck /></span><div><p>Parcelamento público</p><h2>Configuração padrão</h2></div></div><div className="form-grid three"><label>Máximo de parcelas<input name="maxInstallments" type="number" min="1" max="24" defaultValue={settings.maxInstallments} /></label><label>Máquina padrão<select name="defaultMachineId" defaultValue={settings.defaultMachineId || ""}><option value="">Primeira ativa</option>{payment.machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.name}</option>)}</select></label><label>Bandeira padrão<select name="defaultCardBrandId" defaultValue={settings.defaultCardBrandId || ""}><option value="">Primeira ativa</option>{payment.cardBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label></div></section>

      <div className="sticky-form-actions"><button className="primary-button" type="submit"><Save />Salvar configurações</button></div>
    </form>

    <section className="admin-panel integration-status">
      <div className="admin-panel-heading"><span><Database /></span><div><p>Integrações</p><h2>Status e conexão do Tiny</h2></div></div>
      <div className="integration-grid">
        <div><strong>Sistema de mídia</strong><span className={process.env.MEDIA_API_URL && process.env.MEDIA_API_TOKEN ? "configured" : "missing"}>{process.env.MEDIA_API_URL && process.env.MEDIA_API_TOKEN ? "Configurado" : "Pendente"}</span></div>
        <div><strong>Tiny para custo</strong><span className={tiny.connected && !tiny.needsReconnect ? "configured" : "missing"}>{tinyLabel(tiny)}</span></div>
        <div><strong>Banco MySQL</strong><span className={process.env.DATABASE_URL ? "configured" : "missing"}>{process.env.DATABASE_URL ? "Configurado" : "Modo demonstração"}</span></div>
      </div>
      <div className="integration-detail">
        <p><Link2 />Cadastre no aplicativo do Tiny esta URL de redirecionamento:</p>
        <code>{callbackUrl}</code>
        {tiny.connectedAt && <small>Última conexão registrada: {tiny.connectedAt}</small>}
      </div>
      <div className="integration-actions">
        <a className="primary-button" href="/api/tiny/connect"><RefreshCw />{tiny.connected ? "Reconectar Tiny" : "Conectar Tiny"}</a>
        {tiny.mode === "oauth" && <form action={disconnectTinyAction}><button className="secondary-button" type="submit"><Unplug />Desconectar</button></form>}
      </div>
      <p className="field-help">O Tiny é usado somente como contingência para custos ausentes. Produtos, fotos e descrições continuam vindo do sistema de mídia.</p>
    </section>
  </>;
}
