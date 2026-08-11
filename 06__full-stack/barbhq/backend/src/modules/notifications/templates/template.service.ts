import { NotificationType } from '../../../models/notification.model';
import type { TemplateRegistry } from './template.types';

export const DEFAULT_TEMPLATES: TemplateRegistry = {
  [NotificationType.EMPLOYEE_LATE]: {
    title: 'Late Arrival Alert',
    message: '{{employeeName}} checked in late at {{checkInTime}}.',
  },
  [NotificationType.LEAVE_REQUESTED]: {
    title: 'New Leave Request',
    message: '{{employeeName}} requested {{leaveType}} leave from {{startDate}} to {{endDate}}.',
  },
  [NotificationType.LEAVE_APPROVED]: {
    title: 'Leave Request Approved',
    message: 'Your {{leaveType}} leave request for {{startDate}} to {{endDate}} has been approved.',
  },
  [NotificationType.LEAVE_REJECTED]: {
    title: 'Leave Request Rejected',
    message: 'Your {{leaveType}} leave request for {{startDate}} to {{endDate}} was rejected. Reason: {{reason}}.',
  },
  [NotificationType.PAYROLL_PROCESSED]: {
    title: 'Payroll Processed',
    message: 'Payroll for period {{periodName}} has been processed. Net Payable: ₨{{netPayable}}.',
  },
  [NotificationType.PAYROLL_FINALIZED]: {
    title: 'Payroll Finalized',
    message: 'Payroll for period {{periodName}} has been finalized.',
  },
  [NotificationType.LOW_STOCK]: {
    title: 'Low Stock Alert',
    message: '{{itemName}} is running low. Only {{quantity}} {{unit}} remaining.',
  },
  [NotificationType.OUT_OF_STOCK]: {
    title: 'Out of Stock Alert',
    message: '{{itemName}} is completely out of stock!',
  },
  [NotificationType.EXPENSE_CREATED]: {
    title: 'New Expense Recorded',
    message: 'Expense "{{title}}" of ₨{{amount}} was recorded.',
  },
  [NotificationType.SALE_COMPLETED]: {
    title: 'Sale Completed',
    message: 'Sale #{{saleNumber}} completed for ₨{{totalAmount}}.',
  },
  [NotificationType.CASH_SESSION_CLOSED]: {
    title: 'Cash Register Session Closed',
    message: 'Cash register session closed with total sales ₨{{totalSales}}.',
  },
  [NotificationType.SYSTEM]: {
    title: 'System Notification',
    message: '{{message}}',
  },
};

export class TemplateService {
  private templates: TemplateRegistry;

  constructor(customTemplates?: Partial<TemplateRegistry>) {
    this.templates = {
      ...DEFAULT_TEMPLATES,
      ...customTemplates,
    };
  }

  render(type: NotificationType, data: Record<string, unknown> = {}): { title: string; message: string } {
    const template = this.templates[type] || DEFAULT_TEMPLATES[NotificationType.SYSTEM];
    let title = (data.title as string) || template.title;
    let message = (data.message as string) || template.message;

    // Substitute {{variable}} placeholders with provided data fields
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      const valStr = String(value);
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      title = title.replace(regex, valStr);
      message = message.replace(regex, valStr);
    });

    return { title, message };
  }

}

export const templateService = new TemplateService();
