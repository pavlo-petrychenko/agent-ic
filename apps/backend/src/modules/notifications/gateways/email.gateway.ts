import type { EmailMessage } from '@/modules/notifications/typedefs/email.typedefs';

export abstract class EmailGateway {
  abstract send(message: EmailMessage): Promise<void>;
}
