import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdentityModule } from '@/modules/identity';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueuesModule } from '@/platform/queues/queues.module';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { ensureUserRow, ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import { TestTransactionService } from '@test/support/services/test-transaction.service';

describe('NotificationSettingsService', () => {
  let module: TestingModule;
  let settings: NotificationSettingsService;
  let repository: NotificationSettingsRepository;
  let tenants: TenantTransactionService;
  let transactions: TestTransactionService;
  let ids: IdService;

  const seed = async (): Promise<{ readonly workspaceId: string; readonly userId: string }> => {
    const workspaceId = ids.generate();
    const userId = ids.generate();
    await ensureWorkspaceRow(module, workspaceId);
    await ensureUserRow(module, userId);
    return { workspaceId, userId };
  };

  beforeAll(async () => {
    module = await createPlatformTestingModule(TestRedisPrefix.NotificationSettings, [
      RedisModule,
      RateLimitModule,
      QueuesModule.forRole(Role.Api),
      DomainEventsModule.forRole(Role.Api),
      IdentityModule.forRole(Role.Api),
      NotificationsModule.forRole(Role.Api),
    ]);
    settings = module.get(NotificationSettingsService);
    repository = module.get(NotificationSettingsRepository);
    tenants = module.get(TenantTransactionService);
    transactions = module.get(TestTransactionService);
    ids = module.get(IdService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('returns the defaults without writing a settings row', async () => {
    const { workspaceId, userId } = await seed();

    const view = await tenants.run(workspaceId, () => settings.describe(workspaceId, userId));

    expect(view).toEqual({
      platform: { enabled: true },
      email: { enabled: true, email: null, verifiedAt: null },
      telegram: { enabled: false, linked: false, username: null, linkedAt: null },
    });
    expect(
      await tenants.run(workspaceId, () => repository.findByUser(workspaceId, userId)),
    ).toBeNull();
  });

  it('creates the settings and channel rows on the first update', async () => {
    const { workspaceId, userId } = await seed();

    await transactions.rollback(async () => {
      const view = await tenants.run(workspaceId, () =>
        settings.setChannelEnabled(workspaceId, userId, NotificationChannel.Email, false),
      );

      expect(view.email.enabled).toBe(false);
      const stored = await tenants.run(workspaceId, () =>
        repository.findByUser(workspaceId, userId),
      );
      expect(stored?.channels).toHaveLength(3);
      expect(
        stored?.channels.find((channel) => channel.channel === NotificationChannel.Email)?.enabled,
      ).toBe(false);
    });
  });

  it('stores an email override and returns it in the view', async () => {
    const { workspaceId, userId } = await seed();
    const email = 'alerts@example.com';

    await transactions.rollback(async () => {
      const view = await tenants.run(workspaceId, () =>
        settings.setEmail(workspaceId, userId, email),
      );

      expect(view.email).toEqual({ enabled: true, email, verifiedAt: null });
    });
  });

  it('lists only enabled and reachable channels', async () => {
    const { workspaceId, userId } = await seed();

    const initial = await tenants.run(workspaceId, () => settings.channelsFor(workspaceId, userId));
    expect(initial).toEqual([NotificationChannel.Platform, NotificationChannel.Email]);

    await transactions.rollback(async () => {
      await tenants.run(workspaceId, () =>
        settings.setChannelEnabled(workspaceId, userId, NotificationChannel.Platform, false),
      );

      expect(
        await tenants.run(workspaceId, () => settings.channelsFor(workspaceId, userId)),
      ).toEqual([NotificationChannel.Email]);
    });
  });

  it('stores a Telegram link code and consumes it into a chat', async () => {
    const { workspaceId, userId } = await seed();
    const linkedAt = new Date('2026-11-07T10:00:00.000Z');
    const expiresAt = new Date('2026-11-07T10:10:00.000Z');

    await transactions.rollback(async () => {
      const channelId = await tenants.run(workspaceId, () =>
        settings.channelIdFor(workspaceId, userId, NotificationChannel.Telegram),
      );
      await tenants.run(workspaceId, () =>
        repository.setTelegramLinkCode(workspaceId, channelId, 'code-hash', expiresAt),
      );

      const link = await tenants.run(workspaceId, () =>
        repository.findTelegramLinkByCodeHash(workspaceId, 'code-hash'),
      );
      expect(link).toMatchObject({ channelId, userId, chatId: null, linkCodeExpiresAt: expiresAt });

      await tenants.run(workspaceId, () =>
        repository.linkTelegramChat(workspaceId, channelId, '42', 'olena', linkedAt),
      );
      const view = await tenants.run(workspaceId, () => settings.describe(workspaceId, userId));
      expect(view.telegram).toMatchObject({
        enabled: false,
        linked: true,
        username: 'olena',
        linkedAt,
      });
    });
  });

  it('does not expose settings from another workspace', async () => {
    const first = await seed();
    const second = await seed();
    await tenants.run(first.workspaceId, () =>
      settings.setChannelEnabled(first.workspaceId, first.userId, NotificationChannel.Email, false),
    );

    const fromSecond = await tenants.run(second.workspaceId, () =>
      repository.findByUser(first.workspaceId, first.userId),
    );

    expect(fromSecond).toBeNull();
  });
});
