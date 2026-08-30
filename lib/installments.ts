import {getCatalogSettings, getPaymentAdminData} from "@/lib/data";
import type {CardBrand, InstallmentOption, InstallmentRate, PaymentMachine} from "@/lib/types";

function ceilMoney(value: number): number {
  return Math.ceil((value - Number.EPSILON) * 100) / 100;
}

export function calculateInstallment(amount: number, rate: InstallmentRate): InstallmentOption {
  const percent = Math.max(0, rate.percentRate) / 100;
  let totalAmount = amount;
  if (rate.passFeeToCustomer) {
    if (percent >= 1) throw new Error("Taxa percentual inválida: deve ser menor que 100%.");
    totalAmount = (amount + Math.max(0, rate.fixedFee)) / (1 - percent);
  }
  const installmentAmount = ceilMoney(totalAmount / rate.installments);
  totalAmount = Number((installmentAmount * rate.installments).toFixed(2));
  return {
    rateId: rate.id,
    machineId: rate.machineId,
    machineName: rate.machinePublicName || rate.machineName,
    cardBrandId: rate.cardBrandId,
    cardBrandName: rate.cardBrandName,
    cardBrandLogoUrl: rate.cardBrandLogoUrl,
    installments: rate.installments,
    percentRate: rate.percentRate,
    fixedFee: rate.fixedFee,
    passFeeToCustomer: rate.passFeeToCustomer,
    baseAmount: amount,
    totalAmount,
    installmentAmount,
  };
}

export async function getInstallmentSimulation(
  amount: number,
  requestedMachineId?: number | null,
  requestedBrandId?: number | null,
): Promise<{
  machines: PaymentMachine[];
  cardBrands: CardBrand[];
  selectedMachineId: number | null;
  selectedCardBrandId: number | null;
  options: InstallmentOption[];
}> {
  const [settings, data] = await Promise.all([getCatalogSettings(), getPaymentAdminData()]);
  const machines = data.machines.filter((item) => item.active);
  const cardBrands = data.cardBrands.filter((item) => item.active);
  const selectedMachineId = requestedMachineId
    || settings.defaultMachineId
    || machines[0]?.id
    || null;
  const selectedCardBrandId = requestedBrandId
    || settings.defaultCardBrandId
    || cardBrands[0]?.id
    || null;

  const options = data.rates
    .filter((rate) => rate.active)
    .filter((rate) => selectedMachineId == null || rate.machineId === selectedMachineId)
    .filter((rate) => selectedCardBrandId == null || rate.cardBrandId === selectedCardBrandId)
    .filter((rate) => rate.installments <= settings.maxInstallments)
    .filter((rate) => amount >= rate.minimumTotal)
    .sort((a, b) => a.installments - b.installments)
    .map((rate) => calculateInstallment(amount, rate));

  return {machines, cardBrands, selectedMachineId, selectedCardBrandId, options};
}
