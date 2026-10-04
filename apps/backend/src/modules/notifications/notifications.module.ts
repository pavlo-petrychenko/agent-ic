import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { createEmailGateway } from '@/modules/notifications/helpers/email-gateway.helpers';
import { SendConfirmationEmailListener } from '@/modules/notifications/listeners/send-confirmation-email.listener';
import { SendPasswordResetEmailListener } from '@/modules/notifications/listeners/send-password-reset-email.listener';
import { SendConfirmationEmailUseCase } from '@/modules/notifications/use-cases/send-confirmation-email.use-case';
import { SendPasswordResetEmailUseCase } from '@/modules/notifications/use-cases/send-password-reset-email.use-case';
import { ConfigService } from '@/platform/config/services/config.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class NotificationsModule extends defineModule({
  providers: [
    {
      provide: EmailGateway,
      inject: [ConfigService],
      useFactory: ({ config }: ConfigService): EmailGateway => createEmailGateway(config.email),
    },
    SendConfirmationEmailUseCase,
    SendPasswordResetEmailUseCase,
  ],
  listeners: [SendConfirmationEmailListener, SendPasswordResetEmailListener],
}) {}
