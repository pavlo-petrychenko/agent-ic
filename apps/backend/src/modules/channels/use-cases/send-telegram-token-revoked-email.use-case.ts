import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import type { TelegramTokenRevokedInput } from '@/modules/channels/events/telegram-token-revoked.event';
import {
  telegramTokenRevokedEmailCopy,
  telegramTokenRevokedEmailElement,
  telegramTokenRevokedEmailLink,
} from '@/modules/channels/helpers/telegram-token-revoked-email.helpers';
import { ChannelDirectoryService } from '@/modules/channels/services/channel-directory.service';
import type {
  TelegramTokenRevokedEmailAudience,
  TelegramTokenRevokedEmailRecipient,
} from '@/modules/channels/typedefs/telegram-token-revoked-email.typedefs';
import { MembershipsRepository, UsersRepository, WorkspacesRepository } from '@/modules/identity';
import { EmailGateway, EmailTemplate, renderEmail } from '@/modules/notifications';
import { ConfigService } from '@/platform/config/services/config.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SendTelegramTokenRevokedEmailUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly channels: ChannelDirectoryService,
    private readonly email: EmailGateway,
    private readonly config: ConfigService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: TelegramTokenRevokedInput): Promise<void> {
    requireSystemActor(ctx);
    const audience = await this.tenants.run(input.workspaceId, () => this.loadAudience(input));
    if (audience === null) {
      return;
    }
    const link = telegramTokenRevokedEmailLink(
      this.config.config.publicUrl,
      this.ids.toPublic(IdPrefix.Workspace, input.workspaceId),
      this.ids.toPublic(IdPrefix.Channel, input.channelId),
    );
    for (const recipient of audience.recipients) {
      const props = {
        recipient,
        workspaceName: audience.workspaceName,
        channelName: audience.channelName,
        link,
      };
      const copy = telegramTokenRevokedEmailCopy(props);
      const rendered = await renderEmail(telegramTokenRevokedEmailElement(props, copy));
      await this.email.send({
        template: EmailTemplate.TelegramTokenRevoked,
        to: recipient.email,
        subject: copy.subject,
        ...rendered,
      });
    }
  }

  private async loadAudience(
    input: TelegramTokenRevokedInput,
  ): Promise<TelegramTokenRevokedEmailAudience | null> {
    const workspace = await this.workspaces.findById(input.workspaceId);
    if (workspace === null) {
      return null;
    }
    const ownerIds = await this.memberships.listUserIds(input.workspaceId, {
      role: WorkspaceRole.Owner,
    });
    const adminIds = await this.memberships.listUserIds(input.workspaceId, {
      role: WorkspaceRole.Admin,
    });
    const userIds = [...new Set([...ownerIds, ...adminIds])];
    const users = await Promise.all(userIds.map((userId) => this.users.findById(userId)));
    const channel = await this.channels.findSummary(input.workspaceId, input.channelId);
    return {
      workspaceName: workspace.name,
      channelName: channel?.name ?? null,
      recipients: users.flatMap((user): TelegramTokenRevokedEmailRecipient[] =>
        user === null ? [] : [{ email: user.email, name: user.name, locale: user.locale }],
      ),
    };
  }
}
