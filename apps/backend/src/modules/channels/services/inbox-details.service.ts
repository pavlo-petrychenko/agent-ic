import { IdPrefix } from '@agent-ic/contracts';
import { RecipientsKind } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  escalationNotifyOf,
  guardOf,
  handlerOf,
  notifiedOf,
  runOf,
} from '@/modules/channels/helpers/inbox-details.helpers';
import { ChannelDirectoryService } from '@/modules/channels/services/channel-directory.service';
import type {
  EscalationNotify,
  InboxDetails,
  InboxDetailsNotified,
  InboxDetailsRunSnapshot,
} from '@/modules/channels/typedefs/inbox-details.typedefs';
import {
  ConversationNotFoundError,
  ConversationsRepository,
  MessagesRepository,
} from '@/modules/conversations';
import { MembershipsRepository, UsersRepository } from '@/modules/identity';
import { RunStatus, RunStepsRepository, RunsRepository } from '@/modules/runs';
import type { Run, RunStep } from '@/modules/runs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class InboxDetailsService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly runs: RunsRepository,
    private readonly runSteps: RunStepsRepository,
    private readonly channels: ChannelDirectoryService,
    private readonly agentRuntime: AgentRuntimeReader,
    private readonly members: MembershipsRepository,
    private readonly users: UsersRepository,
    private readonly ids: IdService,
  ) {}

  async get(workspaceId: string, publicId: string): Promise<InboxDetails> {
    const id = this.ids.fromPublic(IdPrefix.Conversation, publicId);
    const conversation = await this.conversations.findById(workspaceId, id);
    if (conversation === null) {
      throw new ConversationNotFoundError(publicId);
    }
    const [messages, runs, channel] = await Promise.all([
      this.messages.listByConversation(workspaceId, id),
      this.runs.listByConversation(workspaceId, id),
      conversation.channelId === null
        ? Promise.resolve(null)
        : this.channels.findSummary(workspaceId, conversation.channelId),
    ]);
    const escalated = runs.filter((run) => run.status === RunStatus.Escalated).at(-1) ?? null;
    const [snapshot, names] = await Promise.all([
      escalated === null ? Promise.resolve(null) : this.snapshotOf(workspaceId, escalated),
      this.userNames([conversation.handledBy, ...messages.map((message) => message.authorUserId)]),
    ]);
    return {
      guard: snapshot === null ? null : guardOf(snapshot.steps, snapshot.flow),
      run:
        snapshot === null
          ? null
          : runOf(snapshot.run, snapshot.steps, snapshot.flow, this.ids, snapshot.versionNumber),
      channelName: channel?.name ?? null,
      replyTarget: channel?.replyTarget ?? null,
      notified:
        snapshot === null
          ? null
          : await this.notifiedFor(workspaceId, snapshot.steps, snapshot.flow),
      handled: handlerOf(messages, conversation.handledBy, names),
      runsCount: runs.length,
    };
  }

  private async snapshotOf(workspaceId: string, run: Run): Promise<InboxDetailsRunSnapshot> {
    const [steps, version] = await Promise.all([
      this.runSteps.listByRun(workspaceId, run.id),
      this.agentRuntime.getVersion(workspaceId, run.versionId),
    ]);
    return { run, versionNumber: version.number, steps, flow: version.flow };
  }

  private async notifiedFor(
    workspaceId: string,
    steps: readonly RunStep[],
    flow: FlowDocument,
  ): Promise<InboxDetailsNotified | null> {
    const notify = escalationNotifyOf(steps, flow);
    if (notify === null) {
      return null;
    }
    return notifiedOf(notify, await this.recipientNames(workspaceId, notify));
  }

  private recipientNames(workspaceId: string, notify: EscalationNotify): Promise<string[]> {
    if (notify.recipients.kind === RecipientsKind.Operators) {
      return Promise.resolve([]);
    }
    if (notify.recipients.kind === RecipientsKind.Role) {
      return this.members.listNames(workspaceId, { role: notify.recipients.role });
    }
    const userIds = notify.recipients.userIds.flatMap(
      (id) => this.ids.tryFromPublic(IdPrefix.User, id) ?? [],
    );
    return this.members.listNames(workspaceId, { userIds });
  }

  private async userNames(ids: readonly (string | null)[]): Promise<ReadonlyMap<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => id !== null))];
    const users = await this.users.findNames(unique);
    return new Map(users.map((user) => [user.id, user.name]));
  }
}
