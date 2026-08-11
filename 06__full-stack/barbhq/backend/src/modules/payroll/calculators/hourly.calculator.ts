export interface HourlyCalculationInput {
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeMultiplier?: number;
  commissionAmount?: number;
  bonusAmount?: number;
  deductionAmount?: number;
}

export interface HourlyCalculationResult {
  baseSalary: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  commissionAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  grossPay: number;
  netPay: number;
}

export const calculateHourlyPayroll = (input: HourlyCalculationInput): HourlyCalculationResult => {
  const regularHours = Math.max(0, input.regularHours);
  const overtimeHours = Math.max(0, input.overtimeHours);
  const hourlyRate = Math.max(0, input.hourlyRate);
  const overtimeMultiplier = input.overtimeMultiplier || 1.5;
  const commissionAmount = Math.max(0, input.commissionAmount || 0);
  const bonusAmount = Math.max(0, input.bonusAmount || 0);
  const deductionAmount = Math.max(0, input.deductionAmount || 0);

  const regularPay = regularHours * hourlyRate;
  const overtimeRate = hourlyRate * overtimeMultiplier;
  const overtimePay = overtimeHours * overtimeRate;

  const grossPay = Math.round((regularPay + overtimePay + commissionAmount + bonusAmount) * 100) / 100;
  const netPay = Math.max(0, Math.round((grossPay - deductionAmount) * 100) / 100);

  return {
    baseSalary: 0,
    regularHours,
    overtimeHours,
    hourlyRate,
    overtimeRate: Math.round(overtimeRate * 100) / 100,
    commissionAmount,
    bonusAmount,
    deductionAmount,
    grossPay,
    netPay,
  };
};
