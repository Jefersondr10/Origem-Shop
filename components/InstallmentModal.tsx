"use client";

import {useEffect, useState} from "react";
import {Check, CreditCard, LoaderCircle, X} from "lucide-react";
import type {CardBrand, InstallmentOption, PaymentMachine} from "@/lib/types";
import {formatMoney} from "@/lib/utils";

type Simulation = {
  machines: PaymentMachine[];
  cardBrands: CardBrand[];
  selectedMachineId: number | null;
  selectedCardBrandId: number | null;
  options: InstallmentOption[];
};

export function InstallmentModal({
  open,
  amount,
  title,
  onClose,
  onSelect,
}: {
  open: boolean;
  amount: number;
  title: string;
  onClose: () => void;
  onSelect?: (option: InstallmentOption) => void;
}) {
  const [data, setData] = useState<Simulation | null>(null);
  const [machineId, setMachineId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || amount <= 0) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({amount: String(amount)});
    if (machineId) params.set("machineId", String(machineId));
    if (brandId) params.set("brandId", String(brandId));
    fetch(`/api/installments?${params}`, {signal: controller.signal})
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Falha no cálculo.");
        return body as Simulation;
      })
      .then((body) => {
        setData(body);
        if (!machineId && body.selectedMachineId) setMachineId(body.selectedMachineId);
        if (!brandId && body.selectedCardBrandId) setBrandId(body.selectedCardBrandId);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Falha no cálculo.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, amount, machineId, brandId]);

  useEffect(() => {
    if (!open) {
      setData(null);
      setMachineId(null);
      setBrandId(null);
      setError("");
    }
  }, [open]);

  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="modal-card installment-modal" role="dialog" aria-modal="true" aria-label="Simulador de parcelamento" onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar"><X /></button>
      <div className="modal-heading"><span><CreditCard /></span><div><small>Simulação sobre {formatMoney(amount)}</small><h2>{title}</h2></div></div>

      {(data?.machines.length || data?.cardBrands.length) ? <div className="installment-selectors">
        {data.machines.length > 1 && <label>Máquina<select value={machineId || ""} onChange={(event) => setMachineId(Number(event.target.value) || null)}>{data.machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.publicName || machine.name}</option>)}</select></label>}
        {data.cardBrands.length > 1 && <label>Bandeira<select value={brandId || ""} onChange={(event) => setBrandId(Number(event.target.value) || null)}>{data.cardBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>}
      </div> : null}

      {loading && !data && <div className="modal-state"><LoaderCircle className="spin" />Calculando...</div>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && data?.options.length === 0 && <div className="modal-state">Nenhuma taxa foi cadastrada para essa combinação.</div>}
      {data && data.options.length > 0 && <div className="installment-list">
        {data.options.map((option) => onSelect
          ? <button key={option.rateId} type="button" className="installment-row selectable" onClick={() => onSelect(option)}>
              <span><strong>{option.installments}x de {formatMoney(option.installmentAmount)}</strong><small>Total {formatMoney(option.totalAmount)}</small></span><em><Check />Usar</em>
            </button>
          : <div key={option.rateId} className="installment-row"><strong>{option.installments}x de {formatMoney(option.installmentAmount)}</strong><span>Total {formatMoney(option.totalAmount)}</span></div>)}
      </div>}
      <p className="modal-note">A simulação usa a tabela cadastrada no painel. A confirmação final ocorre no atendimento.</p>
    </section>
  </div>;
}
