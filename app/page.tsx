import {CatalogClient} from "@/components/CatalogClient";
import {buildFacets, getCatalogSettings, getPublicProducts} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings] = await Promise.all([getPublicProducts(), getCatalogSettings()]);
  return <CatalogClient products={products} brands={buildFacets(products, "brand")} categories={buildFacets(products, "category")} settings={settings} />;
}
