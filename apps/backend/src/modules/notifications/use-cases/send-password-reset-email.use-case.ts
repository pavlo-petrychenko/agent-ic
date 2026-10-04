import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { PasswordResetsService } from '@/modules/identity';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
import {
  passwordResetEmailElement,
  passwordResetEmailSubject,
  passwordResetLink,
} from '@/modules/notifications/helpers/password-reset-email.helpers';
import type { SendPasswordResetEmailInput } from '@/modules/notifications/typedefs/send-password-reset-email.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SendPasswordResetEmailUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly passwordResets: PasswordResetsService,
    private readonly email: EmailGateway,
    private readonly config: ConfigService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SendPasswordResetEmailInput): Promise<void> {
    requireSystemActor(ctx);
    const reset = await this.txHost.withTransaction(() =>
      this.passwordResets.issueResetToken(input.userId),
    );
    if (reset === null) {
      return;
    }
    const rendered = await renderEmail(
      passwordResetEmailElement({
        locale: reset.locale,
        name: reset.name,
        link: passwordResetLink(this.config.config.publicUrl, reset.token),
      }),
    );
    await this.email.send({
      to: reset.email,
      subject: passwordResetEmailSubject(reset.locale),
      ...rendered,
    });
  }
}
