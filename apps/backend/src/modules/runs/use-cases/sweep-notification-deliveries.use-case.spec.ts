import { describe, expect, it, vi } from 'vitest';
import { NotificationChannel, NotificationDeliverySweepRepository } from '@/modules/notifications';
import { deliverNotificationJob } from '@/modules/runs/jobs/deliver-notification.job';
import { SweepNotificationDeliveriesUseCase } from '@/modules/runs/use-cases/sweep-notification-deliveries.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { userCtx } from '@test/support/fixtures/identity.fixture';

const NOW = new Date('2026-11-08T10:00:00.000Z');

const createUseCase = (
  findDue: ReturnType<typeof vi.fn>,
  enqueue: ReturnType<typeof vi.fn>,
): SweepNotificationDeliveriesUseCase =>
  new SweepNotificationDeliveriesUseCase(
    { findDue } as unknown as NotificationDeliverySweepRepository,
    { enqueue } as unknown as JobsService,
    { now: () => NOW } as unknown as ClockService,
  );

const ctx = (): UseCaseCtx => workspaceSystemCtx('workspace-1');

describe('SweepNotificationDeliveriesUseCase', () => {
  it('enqueues a delivery job for every due row', async () => {
    const findDue = vi.fn<NotificationDeliverySweepRepository['findDue']>().mockResolvedValue([
      {
        id: 'delivery-1',
        workspaceId: 'workspace-1',
        notificationId: 'notification-1',
        channel: NotificationChannel.Email,
      },
      {
        id: 'delivery-2',
        workspaceId: 'workspace-2',
        notificationId: 'notification-2',
        channel: NotificationChannel.Telegram,
      },
    ]);
    const enqueue = vi.fn<JobsService['enqueue']>().mockResolvedValue(undefined);
    const useCase = createUseCase(findDue, enqueue);

    await expect(useCase.execute(ctx())).resolves.toBe(2);

    expect(findDue).toHaveBeenCalledWith(NOW, 100);
    expect(enqueue).toHaveBeenNthCalledWith(
      1,
      { ...ctx(), workspaceId: 'workspace-1' },
      deliverNotificationJob,
      { notificationId: 'notification-1', channel: NotificationChannel.Email },
    );
    expect(enqueue).toHaveBeenNthCalledWith(
      2,
      { ...ctx(), workspaceId: 'workspace-2' },
      deliverNotificationJob,
      { notificationId: 'notification-2', channel: NotificationChannel.Telegram },
    );
  });

  it('does nothing when no delivery is due', async () => {
    const findDue = vi.fn<NotificationDeliverySweepRepository['findDue']>().mockResolvedValue([]);
    const enqueue = vi.fn<JobsService['enqueue']>();
    const useCase = createUseCase(findDue, enqueue);

    await expect(useCase.execute(ctx())).resolves.toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('runs only as the system actor', async () => {
    const findDue = vi.fn<NotificationDeliverySweepRepository['findDue']>();
    const enqueue = vi.fn<JobsService['enqueue']>();
    const useCase = createUseCase(findDue, enqueue);

    await expect(useCase.execute(userCtx('user-1'))).rejects.toBeInstanceOf(
      SystemActorRequiredError,
    );
    expect(findDue).not.toHaveBeenCalled();
  });
});
