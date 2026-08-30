export type CatalogSettings = {
  catalogName: string;
  logoUrl: string;
  whatsapp: string;
  whatsappMessageTemplate: string;
  instagram: string;
  address: string;
  mapsUrl: string;
  businessHours: string;
  footerText: string;
  maxInstallments: number;
  defaultMachineId: number | null;
  defaultCardBrandId: number | null;
};

export type PublicProduct = {
  id: number;
  externalId: string;
  slug: string;
  name: string;
  sku: string;
  ean: string;
  shortDescription: string;
  descriptionHtml: string;
  brand: string;
  brandSlug: string;
  brandLogoUrl: string;
  category: string;
  categorySlug: string;
  images: string[];
  attributes: Record<string, string | number | boolean | null>;
  stockStatus: string;
  featured: boolean;
  salePrice: number | null;
  promotionalPrice: number | null;
  effectivePrice: number | null;
  promotionActive: boolean;
};

export type CatalogFacet = {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  count: number;
};

export type AdminDashboard = {
  totalProducts: number;
  publishedProducts: number;
  hiddenProducts: number;
  withoutPrice: number;
  withoutCost: number;
  withoutImage: number;
  withoutBrand: number;
  withoutCategory: number;
  featured: number;
  promotions: number;
  lastSync: {
    status: string;
    startedAt: string;
    finishedAt: string;
    stats: Record<string, unknown>;
    errorMessage: string;
  } | null;
};


export type AdminBrand = {
  id: number;
  name: string;
  sourceLogoUrl: string;
  manualLogoUrl: string;
  effectiveLogoUrl: string;
  active: boolean;
  productCount: number;
};

export type AdminProduct = {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  image: string;
  cost: number | null;
  costSource: string;
  salePrice: number | null;
  promotionalPrice: number | null;
  promotionStartsAt: string;
  promotionEndsAt: string;
  published: boolean;
  featured: boolean;
  sourceActive: boolean;
};

export type PaymentMachine = {
  id: number;
  name: string;
  publicName: string;
  active: boolean;
  passFeeToCustomer: boolean;
  sortOrder: number;
};

export type CardBrand = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  active: boolean;
  sortOrder: number;
};

export type InstallmentRate = {
  id: number;
  machineId: number;
  machineName: string;
  machinePublicName: string;
  passFeeToCustomer: boolean;
  cardBrandId: number;
  cardBrandName: string;
  cardBrandLogoUrl: string;
  installments: number;
  percentRate: number;
  fixedFee: number;
  minimumTotal: number;
  active: boolean;
};

export type InstallmentOption = {
  rateId: number;
  machineId: number;
  machineName: string;
  cardBrandId: number;
  cardBrandName: string;
  cardBrandLogoUrl: string;
  installments: number;
  percentRate: number;
  fixedFee: number;
  passFeeToCustomer: boolean;
  baseAmount: number;
  totalAmount: number;
  installmentAmount: number;
};

export type CartLine = {
  product: Pick<PublicProduct, "id" | "slug" | "name" | "sku" | "images" | "effectivePrice">;
  quantity: number;
};
