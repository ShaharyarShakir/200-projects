export interface MonthlyCalculationInput {
  baseSalary: number;
  regularHours?: number;
  overtimeHours?: number;
  overtimeMultiplier?: number;
  commissionAmount?: number;
  bonusAmount?: number;
  deductionAmount?: number;
}

export interface MonthlyCalculationResult {
  baseSalary: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate?: number;
  overtimeRate: number;
  commissionAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  grossPay: number;
  netPay: number;
}

export const calculateMonthlyPayroll = (input: MonthlyCalculationInput): MonthlyCalculationResult => {
  const baseSalary = Math.max(0, input.baseSalary);
  const regularHours = Math.max(0, input.regularHours || 160);
  const overtimeHours = Math.max(0, input.overtimeHours || 0);
  const overtimeMultiplier = input.overtimeMultiplier || 1.5;
  const commissionAmount = Math.max(0, input.commissionAmount || 0);
  const bonusAmount = Math.max(0, input.bonusAmount || 0);
  const deductionAmount = Math.max(0, input.deductionAmount || 0);

  // Equivalent hourly rate based on standard 160 hours/month
  const equivalentHourlyRate = baseSalary / 160;
  const overtimeRate = equivalentHourlyRate * overtimeMultiplier;
  const overtimePay = overtimeHours * overtimeRate;

  const grossPay = Math.round((baseSalary + overtimePay + commissionAmount + bonusAmount) * 100) / 100;
  const netPay = Math.max(0, Math.round((grossPay - deductionAmount) * 100) / 100);

  return {
    baseSalary,
    regularHours,
    overtimeHours,
    hourlyRate: Math.round(equivalentHourlyRate * 100) / 100,
    overtimeRate: Math.round(overtimeRate * 100) / 100,
    commissionAmount,
    bonusAmount,
    deductionAmount,
    grossPay,
    netPay,
  };
};
