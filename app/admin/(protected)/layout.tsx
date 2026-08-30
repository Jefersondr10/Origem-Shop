import Link from "next/link";
import {BadgePercent, Gauge, LogOut, Settings, SlidersHorizontal, Store, Tags} from "lucide-react";
import {requireAdmin} from "@/lib/auth";
import {logoutAction} from "@/app/admin/login/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({children}: {children: React.ReactNode}) {
  await requireAdmin();
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/" className="brand-mark"><span>O</span><strong>Origem</strong></Link>
      <nav>
        <Link href="/admin"><Gauge />Visão geral</Link>
        <Link href="/admin/produtos"><Store />Produtos e preços</Link>
        <Link href="/admin/marcas"><Tags />Marcas e logos</Link>
        <Link href="/admin/parcelamento"><BadgePercent />Parcelamento</Link>
        <Link href="/admin/configuracoes"><Settings />Configurações</Link>
      </nav>
      <div className="admin-sidebar-footer">
        <Link href="/" target="_blank"><SlidersHorizontal />Abrir catálogo</Link>
        <form action={logoutAction}><button type="submit"><LogOut />Sair</button></form>
      </div>
    </aside>
    <main className="admin-content">{children}</main>
  </div>;
}
