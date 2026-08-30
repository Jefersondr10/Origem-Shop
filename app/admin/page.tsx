import {redirect} from "next/navigation";
import AdminClient from "@/components/AdminClient";
import {isAdminAuthenticated} from "@/lib/auth";
import {getDashboardStats, getProducts} from "@/lib/catalog";
import {databaseConfigured} from "@/lib/db";
import {getPaymentConfiguration} from "@/lib/installments";
import {getSettings} from "@/lib/settings";
import {getRecentSyncRuns} from "@/lib/sync";
import {tinyConnectionStatus} from "@/lib/tiny";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const [products, settings, stats, payment, syncRuns, tinyStatus] = await Promise.all([
    getProducts({includeInactive: true, includePrivate: true, limit: 1000}),
    getSettings(),
    getDashboardStats(),
    getPaymentConfiguration(),
    databaseConfigured() ? getRecentSyncRuns() : Promise.resolve([]),
    databaseConfigured() ? tinyConnectionStatus() : Promise.resolve({connected: false, expiresAt: null}),
  ]);
  return <AdminClient products={products} settings={settings} stats={stats} payment={payment} syncRuns={syncRuns} tinyStatus={tinyStatus} />;
}
