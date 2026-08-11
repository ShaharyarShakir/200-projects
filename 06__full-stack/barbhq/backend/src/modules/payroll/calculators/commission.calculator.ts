export interface CommissionCalculationInput {
  commissionEnabled?: boolean;
  commissionRate?: number;
  revenue?: number;
}

export const calculateCommission = (input: CommissionCalculationInput): number => {
  if (!input.commissionEnabled || !input.commissionRate || !input.revenue) {
    return 0;
  }
  const revenue = Math.max(0, input.revenue);
  const rate = Math.max(0, input.commissionRate);
  return Math.round(revenue * (rate / 100) * 100) / 100;
};
