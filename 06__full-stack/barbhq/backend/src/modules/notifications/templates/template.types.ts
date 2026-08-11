import { NotificationType } from '../../../models/notification.model';

export interface NotificationTemplateDefinition {
  title: string;
  message: string;
}

export type TemplateRegistry = Record<NotificationType, NotificationTemplateDefinition>;
