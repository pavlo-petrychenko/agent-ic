import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipsRepository, UsersRepository, WorkspacesRepository } from '@/modules/identity';
import { EmailGateway, EmailTemplate, renderEmail } from '@/modules/notifications';
import {
  usageSettingsLink,
  usageThresholdEmailCopy,
  usageThresholdEmailElement,
} from '@/modules/usage/helpers/usage-email.helpers';
import type { UsageEmailRecipient } from '@/modules/usage/typedefs/usage-email.typedefs';
import type { UsageThresholdReachedInput } from '@/modules/usage/typedefs/usage.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SendUsageThresholdEmailUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly email: EmailGateway,
    private readonly config: ConfigService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UsageThresholdReachedInput): Promise<void> {
    requireSystemActor(ctx);
    const recipient = await this.tenantTransactions.run(input.workspaceId, () =>
      this.findRecipient(input.workspaceId),
    );
    if (recipient === null) {
      return;
    }
    const props = {
      recipient,
      threshold: input.threshold,
      link: usageSettingsLink(
        this.config.config.publicUrl,
        this.ids.toPublic(IdPrefix.Workspace, input.workspaceId),
      ),
    };
    const copy = usageThresholdEmailCopy(props);
    const rendered = await renderEmail(usageThresholdEmailElement(props, copy));
    await this.email.send({
      template: EmailTemplate.UsageThreshold,
      to: recipient.email,
      subject: copy.subject,
      ...rendered,
    });
  }

  private async findRecipient(workspaceId: string): Promise<UsageEmailRecipient | null> {
    const owner = await this.memberships.findOwner(workspaceId);
    const workspace = await this.workspaces.findById(workspaceId);
    const user = owner === null ? null : await this.users.findById(owner.userId);
    if (user === null || workspace === null) {
      return null;
    }
    return {
      email: user.email,
      name: user.name,
      locale: user.locale,
      workspaceName: workspace.name,
    };
  }
}
