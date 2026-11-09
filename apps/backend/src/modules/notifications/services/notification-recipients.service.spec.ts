import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { NO_FLOW_SETTINGS, NotifyChannel, RecipientsKind } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentRuntimeReader, AgentVersion } from '@/modules/agents';
import type { MembershipsRepository } from '@/modules/identity';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import { NotificationRecipientsService } from '@/modules/notifications/services/notification-recipients.service';
import type { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type { HandoffNotify } from '@/modules/notifications/typedefs/notification-recipients.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';
import { TEST_CUSTOMER_NOTICE } from '@test/support/constants/runs-testing.constants';
import {
  agentNode,
  endNode,
  escalateNode,
  stepFlow,
  triggerOnlyFlow,
} from '@test/support/fixtures/runs.fixture';

describe('NotificationRecipientsService', () => {
  const getVersion = vi.fn<AgentRuntimeReader['getVersion']>();
  const listUserIds = vi.fn<MembershipsRepository['listUserIds']>();
  const channelsFor = vi.fn<NotificationSettingsService['channelsFor']>();
  const tryFromPublic = vi.fn<IdService['tryFromPublic']>();
  let service: NotificationRecipientsService;

  const useFlow = (flow: FlowDocument): void => {
    getVersion.mockResolvedValue({ flow } as unknown as AgentVersion);
  };

  beforeEach(() => {
    getVersion.mockReset();
    listUserIds.mockReset();
    channelsFor.mockReset();
    tryFromPublic.mockReset();
    listUserIds.mockResolvedValue([]);
    channelsFor.mockResolvedValue([]);
    service = new NotificationRecipientsService(
      { getVersion } as unknown as AgentRuntimeReader,
      { listUserIds } as unknown as MembershipsRepository,
      { channelsFor } as unknown as NotificationSettingsService,
      { tryFromPublic } as unknown as IdService,
    );
  });

  it('resolves operators and intersects requested channels with each user settings', async () => {
    const node = escalateNode({ kind: RecipientsKind.Operators }, [
      NotifyChannel.InPlatform,
      NotifyChannel.Email,
    ]);
    useFlow(stepFlow([node], []));
    listUserIds.mockResolvedValue(['user-1', 'user-2']);
    channelsFor.mockImplementation((_workspaceId: string, userId: string) =>
      Promise.resolve(
        userId === 'user-1'
          ? [NotificationChannel.Platform, NotificationChannel.Email, NotificationChannel.Telegram]
          : [NotificationChannel.Email],
      ),
    );

    const recipients = await service.recipientsFor('workspace-1', 'version-1', node.id);

    expect(listUserIds).toHaveBeenCalledWith('workspace-1', { role: WorkspaceRole.Operator });
    expect(recipients).toEqual([
      {
        userId: 'user-1',
        channels: [NotificationChannel.Platform, NotificationChannel.Email],
      },
      { userId: 'user-2', channels: [NotificationChannel.Email] },
    ]);
  });

  it('resolves the members of a chosen role', async () => {
    const node = escalateNode({ kind: RecipientsKind.Role, role: WorkspaceRole.Builder }, [
      NotifyChannel.Email,
    ]);
    useFlow(stepFlow([node], []));
    listUserIds.mockResolvedValue(['builder-1']);
    channelsFor.mockResolvedValue([NotificationChannel.Email]);

    const recipients = await service.recipientsFor('workspace-1', 'version-1', node.id);

    expect(listUserIds).toHaveBeenCalledWith('workspace-1', { role: WorkspaceRole.Builder });
    expect(recipients).toEqual([{ userId: 'builder-1', channels: [NotificationChannel.Email] }]);
  });

  it('turns public user ids into internal ids and drops the invalid ones', async () => {
    const node = escalateNode(
      { kind: RecipientsKind.Users, userIds: ['usr_valid', 'usr_invalid'] },
      [NotifyChannel.Email],
    );
    useFlow(stepFlow([node], []));
    tryFromPublic.mockImplementation((_prefix: string, id: string) =>
      id === 'usr_valid' ? 'user-1' : null,
    );
    listUserIds.mockResolvedValue(['user-1']);
    channelsFor.mockResolvedValue([NotificationChannel.Email]);

    const recipients = await service.recipientsFor('workspace-1', 'version-1', node.id);

    expect(tryFromPublic).toHaveBeenCalledWith(IdPrefix.User, 'usr_valid');
    expect(tryFromPublic).toHaveBeenCalledWith(IdPrefix.User, 'usr_invalid');
    expect(listUserIds).toHaveBeenCalledWith('workspace-1', { userIds: ['user-1'] });
    expect(recipients).toEqual([{ userId: 'user-1', channels: [NotificationChannel.Email] }]);
  });

  it('uses the flow handoff settings when the step is not an Escalation node', async () => {
    const node = agentNode('agent-node', 'agent-node');
    const notify: HandoffNotify = {
      recipients: { kind: RecipientsKind.Operators },
      channels: [NotifyChannel.Email],
    };
    const flow = {
      ...stepFlow([node], []),
      settings: {
        ...NO_FLOW_SETTINGS,
        handoff: {
          notify,
          reminderAfterMinutes: null,
          fallbackAfterMinutes: null,
          fallbackMessage: TEST_CUSTOMER_NOTICE,
        },
      },
    };
    useFlow(flow);
    listUserIds.mockResolvedValue(['operator-1']);
    channelsFor.mockResolvedValue([NotificationChannel.Email]);

    const recipients = await service.recipientsFor('workspace-1', 'version-1', node.id);

    expect(recipients).toEqual([{ userId: 'operator-1', channels: [NotificationChannel.Email] }]);
  });

  it('returns nobody when neither the node nor the flow has a handoff notification config', async () => {
    useFlow(triggerOnlyFlow());

    const recipients = await service.recipientsFor('workspace-1', 'version-1', 'missing-node');

    expect(recipients).toEqual([]);
    expect(listUserIds).not.toHaveBeenCalled();
  });

  it('returns nobody for an Escalation node in end mode', async () => {
    const node = endNode('end-node', 'end-node');
    useFlow(stepFlow([node], []));

    const recipients = await service.recipientsFor('workspace-1', 'version-1', node.id);

    expect(recipients).toEqual([]);
    expect(listUserIds).not.toHaveBeenCalled();
  });

  it('drops a recipient whose requested channels are all disabled', async () => {
    const node = escalateNode({ kind: RecipientsKind.Operators }, [NotifyChannel.Telegram]);
    useFlow(stepFlow([node], []));
    listUserIds.mockResolvedValue(['user-1']);
    channelsFor.mockResolvedValue([NotificationChannel.Platform, NotificationChannel.Email]);

    const recipients = await service.recipientsFor('workspace-1', 'version-1', node.id);

    expect(recipients).toEqual([]);
  });
});
