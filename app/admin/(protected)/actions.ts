"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {syncCatalog} from "@/lib/sync";

export async function runSyncAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const full = formData.get("full") === "1";
  let destination: string;

  try {
    const stats = await syncCatalog({full});
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/produtos");
    destination = `/admin?sync=ok&produtos=${stats.products}&custos=${stats.tinyCostsUpdated}`;
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "Falha na sincronização.");
    destination = `/admin?sync=erro&mensagem=${message}`;
  }

  redirect(destination);
}
