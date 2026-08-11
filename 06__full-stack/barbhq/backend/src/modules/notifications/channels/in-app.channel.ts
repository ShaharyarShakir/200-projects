export interface InAppPayload {
  notificationId: string;
  recipientId: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class InAppChannel {
  async send(payload: InAppPayload): Promise<void> {
    // In-app notifications are stored directly in MongoDB (Notification collection)
    // and queried via GET /api/v1/notifications endpoint or WebSockets in Phase 2
  }
}

export const inAppChannel = new InAppChannel();
