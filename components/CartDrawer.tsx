"use client";

import Link from "next/link";
import {Calculator, CheckCircle2, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X} from "lucide-react";
import {useEffect, useState} from "react";
import {useCart} from "@/components/CartProvider";
import {InstallmentModal} from "@/components/InstallmentModal";
import type {CatalogSettings, InstallmentOption} from "@/lib/types";
import {formatMoney, normalizePhone} from "@/lib/utils";

export function CartDrawer({settings}: {settings: CatalogSettings}) {
  const cart = useCart();
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentOption | null>(null);
  const phone = normalizePhone(settings.whatsapp);

  useEffect(() => {
    setSelectedInstallment(null);
  }, [cart.total]);

  const lines = cart.items.map((line, index) => `${index + 1}. ${line.product.name}\nSKU: ${line.product.sku || "Não informado"}\nQuantidade: ${line.quantity}\nSubtotal: ${formatMoney((line.product.effectivePrice || 0) * line.quantity)}`).join("\n\n");
  const installmentText = selectedInstallment
    ? `\n\nCONDIÇÃO SIMULADA: ${selectedInstallment.installments}x de ${formatMoney(selectedInstallment.installmentAmount)}\nTotal parcelado: ${formatMoney(selectedInstallment.totalAmount)}\nBandeira: ${selectedInstallment.cardBrandName}`
    : "";
  const message = encodeURIComponent(`${settings.whatsappMessageTemplate || "Olá! Quero atendimento sobre os produtos abaixo:"}\n\n${lines}\n\nTOTAL À VISTA: ${formatMoney(cart.total)}${installmentText}`);

  return <>
    <div className={cart.isOpen ? "drawer-backdrop open" : "drawer-backdrop"} onMouseDown={cart.closeCart} />
    <aside className={cart.isOpen ? "cart-drawer open" : "cart-drawer"} aria-hidden={!cart.isOpen}>
      <header><div><ShoppingBag /><span><small>Seu carrinho</small><strong>{cart.count} item{cart.count === 1 ? "" : "s"}</strong></span></div><button type="button" onClick={cart.closeCart} aria-label="Fechar carrinho"><X /></button></header>
      <div className="cart-lines">
        {cart.items.length === 0 ? <div className="empty-cart"><ShoppingBag /><h3>Seu carrinho está vazio</h3><p>Adicione produtos para calcular o total e chamar no WhatsApp.</p><button type="button" onClick={cart.closeCart}>Continuar olhando</button></div> : cart.items.map((line) => <article className="cart-line" key={line.product.id}>
          <Link href={`/produto/${line.product.slug}`} onClick={cart.closeCart} className="cart-line-image">
            {line.product.images[0] ? <img src={line.product.images[0]} alt={line.product.name} /> : <span>O</span>}
          </Link>
          <div className="cart-line-content">
            <Link href={`/produto/${line.product.slug}`} onClick={cart.closeCart}><strong>{line.product.name}</strong></Link>
            <small>{line.product.sku}</small>
            <span>{formatMoney(line.product.effectivePrice)}</span>
            <div className="quantity-control">
              <button type="button" onClick={() => cart.updateQuantity(line.product.id, line.quantity - 1)}><Minus /></button>
              <b>{line.quantity}</b>
              <button type="button" onClick={() => cart.updateQuantity(line.product.id, line.quantity + 1)}><Plus /></button>
              <button className="remove-line" type="button" onClick={() => cart.removeItem(line.product.id)} aria-label="Remover"><Trash2 /></button>
            </div>
          </div>
        </article>)}
      </div>
      {cart.items.length > 0 && <footer>
        <div className="cart-total"><span>Total estimado</span><strong>{formatMoney(cart.total)}</strong></div>
        <button className="secondary-button cart-installments" type="button" onClick={() => setInstallmentsOpen(true)}><Calculator />Parcelamento do carrinho</button>
        {selectedInstallment && <div className="selected-installment"><CheckCircle2 /><span><small>Condição escolhida</small><strong>{selectedInstallment.installments}x de {formatMoney(selectedInstallment.installmentAmount)}</strong><em>Total {formatMoney(selectedInstallment.totalAmount)}</em></span></div>}
        {phone
          ? <a className="whatsapp-button" href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer"><MessageCircle />Finalizar pelo WhatsApp</a>
          : <button className="whatsapp-button" type="button" disabled><MessageCircle />WhatsApp não configurado</button>}
        <button className="clear-cart" type="button" onClick={cart.clear}>Limpar carrinho</button>
      </footer>}
    </aside>
    {cart.total > 0 && <InstallmentModal
      open={installmentsOpen}
      amount={cart.total}
      title="Parcelamento do carrinho"
      onClose={() => setInstallmentsOpen(false)}
      onSelect={(option) => { setSelectedInstallment(option); setInstallmentsOpen(false); }}
    />}
  </>;
}
