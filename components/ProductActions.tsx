"use client";

import {Calculator, MessageCircle, ShoppingCart} from "lucide-react";
import {useState} from "react";
import {useCart} from "@/components/CartProvider";
import {InstallmentModal} from "@/components/InstallmentModal";
import type {CatalogSettings, PublicProduct} from "@/lib/types";
import {formatMoney, normalizePhone} from "@/lib/utils";

export function ProductActions({product, settings, large = false}: {product: PublicProduct; settings: CatalogSettings; large?: boolean}) {
  const cart = useCart();
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const phone = normalizePhone(settings.whatsapp);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const productUrl = `${baseUrl}/produto/${product.slug}`;
  const message = encodeURIComponent(`${settings.whatsappMessageTemplate || "Olá! Quero atendimento sobre este produto:"}\n\n${product.name}\nSKU: ${product.sku || "Não informado"}\nValor: ${formatMoney(product.effectivePrice)}\n${productUrl}`);
  const disabled = product.effectivePrice == null;

  return <>
    <div className={large ? "product-actions large" : "product-actions"}>
      <button type="button" onClick={() => setInstallmentsOpen(true)} disabled={disabled} title="Ver parcelamento"><Calculator /><span>Parcelar</span></button>
      <button type="button" onClick={() => cart.addItem(product)} disabled={disabled} title="Adicionar ao carrinho"><ShoppingCart /><span>Carrinho</span></button>
      {phone
        ? <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer" title="Chamar no WhatsApp"><MessageCircle /><span>WhatsApp</span></a>
        : <button type="button" disabled title="WhatsApp ainda não configurado"><MessageCircle /><span>WhatsApp</span></button>}
    </div>
    {product.effectivePrice != null && <InstallmentModal open={installmentsOpen} amount={product.effectivePrice} title={product.name} onClose={() => setInstallmentsOpen(false)} />}
  </>;
}
