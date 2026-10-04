import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import type { EmailMessage } from '@/modules/notifications/typedefs/email.typedefs';

export class FakeEmailGateway extends EmailGateway {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  sentTo(address: string): EmailMessage[] {
    return this.sent.filter((message) => message.to === address);
  }
}
