import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { EmailConfirmationsService } from '@/modules/identity';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import {
  confirmationEmailElement,
  confirmationEmailSubject,
  confirmationLink,
} from '@/modules/notifications/helpers/confirmation-email.helpers';
import { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
import type { SendConfirmationEmailInput } from '@/modules/notifications/typedefs/send-confirmation-email.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SendConfirmationEmailUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly confirmations: EmailConfirmationsService,
    private readonly email: EmailGateway,
    private readonly config: ConfigService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SendConfirmationEmailInput): Promise<void> {
    requireSystemActor(ctx);
    const confirmation = await this.txHost.withTransaction(() =>
      this.confirmations.issueConfirmationToken(input.userId),
    );
    if (confirmation === null) {
      return;
    }
    const rendered = await renderEmail(
      confirmationEmailElement({
        locale: confirmation.locale,
        name: confirmation.name,
        link: confirmationLink(this.config.config.publicUrl, confirmation.token),
      }),
    );
    await this.email.send({
      to: confirmation.email,
      subject: confirmationEmailSubject(confirmation.locale),
      ...rendered,
    });
  }
}
