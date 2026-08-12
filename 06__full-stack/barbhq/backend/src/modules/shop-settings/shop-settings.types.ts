export interface UpdateShopSettingsDto {
  bookingEnabled?: boolean;
  onlineBookingEnabled?: boolean;
  allowWalkIns?: boolean;
  requireCustomerPhone?: boolean;
  allowCustomerCancellation?: boolean;
  cancellationWindowMinutes?: number;
  defaultAppointmentDuration?: number;
  taxEnabled?: boolean;
  taxRate?: number;
  receiptEnabled?: boolean;
}
