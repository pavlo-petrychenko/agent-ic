import { z } from 'zod';
import { NotificationChannel } from '@/modules/notifications';

export const deliverNotificationSchema = z.object({
  notificationId: z.uuid(),
  channel: z.enum(NotificationChannel),
});
