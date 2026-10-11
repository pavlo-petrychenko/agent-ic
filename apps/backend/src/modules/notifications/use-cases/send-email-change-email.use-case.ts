import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { EmailChangesService } from '@/modules/identity';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import {
  emailChangeEmailElement,
  emailChangeEmailSubject,
  emailChangeLink,
} from '@/modules/notifications/helpers/email-change-email.helpers';
import { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
import type { SendEmailChangeEmailInput } from '@/modules/notifications/typedefs/send-email-change-email.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SendEmailChangeEmailUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly emailChanges: EmailChangesService,
    private readonly email: EmailGateway,
    private readonly config: ConfigService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SendEmailChangeEmailInput): Promise<void> {
    requireSystemActor(ctx);
    const change = await this.txHost.withTransaction(() =>
      this.emailChanges.issueChangeToken(input.userId),
    );
    if (change === null) {
      return;
    }
    const rendered = await renderEmail(
      emailChangeEmailElement({
        locale: change.locale,
        name: change.name,
        link: emailChangeLink(this.config.config.publicUrl, change.token),
      }),
    );
    await this.email.send({
      to: change.email,
      subject: emailChangeEmailSubject(change.locale),
      ...rendered,
    });
  }
}
