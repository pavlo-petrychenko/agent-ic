import { IdPrefix, Locale, WorkspaceRole } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TELEGRAM_TOKEN_REVOKED_EMAIL_COPY,
  TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER,
} from '@/modules/channels/constants/telegram-token-revoked-email.constants';
import type { ChannelDirectoryService } from '@/modules/channels/services/channel-directory.service';
import { SendTelegramTokenRevokedEmailUseCase } from '@/modules/channels/use-cases/send-telegram-token-revoked-email.use-case';
import type {
  MembershipsRepository,
  UsersRepository,
  WorkspacesRepository,
} from '@/modules/identity';
import { EmailGateway, EmailTemplate } from '@/modules/notifications';
import type { EmailMessage } from '@/modules/notifications';
import { ConfigService } from '@/platform/config/services/config.service';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';
import { systemCtx, userCtx } from '@test/support/fixtures/identity.fixture';

type User = NonNullable<Awaited<ReturnType<UsersRepository['findById']>>>;
type Workspace = NonNullable<Awaited<ReturnType<WorkspacesRepository['findById']>>>;
type ChannelSummary = Awaited<ReturnType<ChannelDirectoryService['findSummary']>>;

class RecordingEmailGateway extends EmailGateway {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  sentTo(address: string): EmailMessage[] {
    return this.sent.filter((message) => message.to === address);
  }
}

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const CHANNEL_ID = '22222222-2222-4222-8222-222222222222';
const OWNER_ID = '33333333-3333-4333-8333-333333333333';
const ADMIN_ID = '44444444-4444-4444-8444-444444444444';
const WORKSPACE_NAME = 'Kavarnia Lviv';
const CHANNEL_NAME = '@kavarnia_bot';

const OWNER = {
  id: OWNER_ID,
  email: 'owner@agent-ic.test',
  name: 'Demo Owner',
  locale: Locale.En,
} as unknown as User;

const ADMIN = {
  id: ADMIN_ID,
  email: 'admin@agent-ic.test',
  name: 'Olena Admin',
  locale: Locale.Uk,
} as unknown as User;

describe('SendTelegramTokenRevokedEmailUseCase', () => {
  const listUserIds = vi.fn<MembershipsRepository['listUserIds']>();
  const findUser = vi.fn<UsersRepository['findById']>();
  const findWorkspace = vi.fn<WorkspacesRepository['findById']>();
  const findSummary = vi.fn<ChannelDirectoryService['findSummary']>();
  const toPublic = vi.fn<IdService['toPublic']>();
  const emails = new RecordingEmailGateway();
  let sendEmail: SendTelegramTokenRevokedEmailUseCase;

  beforeEach(() => {
    listUserIds.mockReset();
    findUser.mockReset();
    findWorkspace.mockReset();
    findSummary.mockReset();
    toPublic.mockReset();
    emails.sent.length = 0;
    listUserIds.mockImplementation((_workspaceId, selection) =>
      Promise.resolve(
        'role' in selection && selection.role === WorkspaceRole.Owner ? [OWNER.id] : [ADMIN.id],
      ),
    );
    findUser.mockImplementation((id) =>
      Promise.resolve(id === OWNER.id ? OWNER : id === ADMIN.id ? ADMIN : null),
    );
    findWorkspace.mockResolvedValue({ name: WORKSPACE_NAME } as unknown as Workspace);
    findSummary.mockResolvedValue({ name: CHANNEL_NAME, replyTarget: null } as ChannelSummary);
    toPublic.mockImplementation((prefix, id) => `${prefix}_${id}`);
    sendEmail = new SendTelegramTokenRevokedEmailUseCase(
      {
        run: <T>(_workspaceId: string, work: () => Promise<T>): Promise<T> => work(),
      } as unknown as TenantTransactionService,
      { listUserIds } as unknown as MembershipsRepository,
      { findById: findUser } as unknown as UsersRepository,
      { findById: findWorkspace } as unknown as WorkspacesRepository,
      { findSummary } as unknown as ChannelDirectoryService,
      emails,
      {
        config: { publicUrl: 'https://app.agent-ic.test' },
      } as unknown as ConfigService,
      { toPublic } as unknown as IdService,
    );
  });

  it('emails every owner and admin in their own language', async () => {
    await sendEmail.execute(systemCtx(), { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID });

    expect(emails.sent).toHaveLength(2);
    const [ownerMessage] = emails.sentTo(OWNER.email);
    const [adminMessage] = emails.sentTo(ADMIN.email);
    expect(ownerMessage).toMatchObject({
      template: EmailTemplate.TelegramTokenRevoked,
      to: OWNER.email,
      subject: TELEGRAM_TOKEN_REVOKED_EMAIL_COPY[Locale.En].subject.replaceAll(
        TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER,
        WORKSPACE_NAME,
      ),
    });
    expect(ownerMessage?.text).toContain('Demo Owner');
    expect(ownerMessage?.text).toContain(CHANNEL_NAME);
    expect(ownerMessage?.text).toContain('Replace token');
    expect(adminMessage?.subject).toBe(
      TELEGRAM_TOKEN_REVOKED_EMAIL_COPY[Locale.Uk].subject.replaceAll(
        TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER,
        WORKSPACE_NAME,
      ),
    );
    expect(adminMessage?.text).toContain('Olena Admin');
    expect(adminMessage?.text).toContain('Замінити токен');
    const link = `https://app.agent-ic.test/w/${IdPrefix.Workspace}_${WORKSPACE_ID}/channels/telegram/${IdPrefix.Channel}_${CHANNEL_ID}`;
    expect(ownerMessage?.html).toContain(link);
    expect(adminMessage?.html).toContain(link);
  });

  it('falls back to the generic channel copy when the channel is gone', async () => {
    findSummary.mockResolvedValue(null);

    await sendEmail.execute(systemCtx(), { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID });

    expect(emails.sentTo(OWNER.email)[0]?.text).toContain('the Telegram bot');
  });

  it('sends nothing when the workspace no longer exists', async () => {
    findWorkspace.mockResolvedValue(null);

    await sendEmail.execute(systemCtx(), { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID });

    expect(emails.sent).toEqual([]);
  });

  it('refuses a non-system actor', async () => {
    const attempt = sendEmail.execute(userCtx(OWNER_ID), {
      workspaceId: WORKSPACE_ID,
      channelId: CHANNEL_ID,
    });

    await expect(attempt).rejects.toBeInstanceOf(SystemActorRequiredError);
    expect(emails.sent).toEqual([]);
  });
});
