import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  INBOX_CONVERSATIONS_DEFAULT_LIMIT,
  INBOX_QUEUE_STATES,
  InboxQueue,
} from '@/modules/conversations/constants/inbox.constants';
import {
  MessageAuthor,
  MessageSystemEvent,
} from '@/modules/conversations/constants/message.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type {
  InboxConversationsInput,
  InboxCounts,
  InboxCountsInput,
  InboxDetail,
  InboxFilter,
  InboxFilterOptions,
  InboxSummary,
} from '@/modules/conversations/typedefs/inbox.typedefs';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import { UsersRepository } from '@/modules/identity';
import { IdService } from '@/platform/ids/services/id.service';

interface InboxAgentInfo {
  readonly name: string;
  readonly version: number;
}

@Injectable()
export class InboxConversationsService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly agentRuntime: AgentRuntimeReader,
    private readonly users: UsersRepository,
    private readonly simulations: SimulationsService,
    private readonly ids: IdService,
  ) {}

  async list(
    workspaceId: string,
    userId: string,
    input: InboxConversationsInput,
  ): Promise<readonly InboxSummary[]> {
    const cursor =
      input.after === null || input.after === undefined
        ? null
        : {
            lastMessageAt: new Date(input.after.lastMessageAt),
            id: this.ids.fromPublic(IdPrefix.Conversation, input.after.id),
          };
    const rows = await this.conversations.listLive(
      workspaceId,
      { ...this.internalFilter(input), states: INBOX_QUEUE_STATES[input.queue] },
      input.limit ?? INBOX_CONVERSATIONS_DEFAULT_LIMIT,
      cursor,
    );
    if (rows.length === 0) {
      return [];
    }
    const [previews, agents, names, handledBefore] = await Promise.all([
      this.messages.latestByConversationIds(
        workspaceId,
        rows.map((row) => row.id),
      ),
      this.agentInfo(workspaceId, rows),
      this.userNames(rows.map((row) => row.handledBy)),
      this.messages.conversationIdsWithOperatorHistory(
        workspaceId,
        rows.map((row) => row.id),
      ),
    ]);
    const previewByConversation = new Map(
      previews.map((message) => [message.conversationId, message]),
    );
    const handledBeforeIds = new Set(handledBefore);
    return rows.map((row) =>
      this.summaryOf(
        row,
        previewByConversation.get(row.id) ?? null,
        agents,
        userId,
        names,
        row.handledBy !== null || handledBeforeIds.has(row.id),
      ),
    );
  }

  needsYouCount(workspaceId: string): Promise<number> {
    return this.conversations.countNeedsYou(workspaceId);
  }

  async counts(workspaceId: string, filter: InboxCountsInput): Promise<InboxCounts> {
    const rows = await this.conversations.countByState(workspaceId, this.internalFilter(filter));
    const totals = new Map(rows.map((row) => [row.state, row.total]));
    const totalOf = (queue: InboxQueue): number =>
      INBOX_QUEUE_STATES[queue].reduce((total, state) => total + (totals.get(state) ?? 0), 0);
    return {
      needsYou: totalOf(InboxQueue.NeedsYou),
      live: totalOf(InboxQueue.Live),
      closed: totalOf(InboxQueue.Closed),
    };
  }

  filterOptions(workspaceId: string): Promise<InboxFilterOptions> {
    return this.conversations.listFilterRefs(workspaceId);
  }

  private internalFilter(filter: InboxFilter): InboxFilter {
    return {
      channelIds: filter.channelIds.map((id) => this.ids.fromPublic(IdPrefix.Channel, id)),
      agentIds: filter.agentIds.map((id) => this.ids.fromPublic(IdPrefix.Agent, id)),
      search: filter.search,
    };
  }

  async get(workspaceId: string, userId: string, publicId: string): Promise<InboxDetail> {
    const id = this.ids.fromPublic(IdPrefix.Conversation, publicId);
    const conversation = await this.conversations.findById(workspaceId, id);
    if (conversation === null) {
      throw new ConversationNotFoundError(publicId);
    }
    const [messages, agents] = await Promise.all([
      this.messages.listByConversation(workspaceId, conversation.id),
      this.agentInfo(workspaceId, [conversation]),
    ]);
    const names = await this.userNames([
      conversation.handledBy,
      ...messages.map((message) => message.authorUserId),
    ]);
    return {
      summary: this.summaryOf(
        conversation,
        messages.at(-1) ?? null,
        agents,
        userId,
        names,
        conversation.handledBy !== null ||
          messages.some(
            (message) =>
              message.author === MessageAuthor.Operator ||
              message.systemEvent === MessageSystemEvent.TookOver,
          ),
      ),
      messages: messages.map((message) =>
        this.simulations.messageView(
          message,
          message.authorUserId === null ? null : (names.get(message.authorUserId) ?? null),
        ),
      ),
    };
  }

  private async agentInfo(
    workspaceId: string,
    rows: readonly Conversation[],
  ): Promise<ReadonlyMap<string, InboxAgentInfo>> {
    const ids = [...new Set(rows.map((row) => row.agentId))];
    const entries = await Promise.all(
      ids.map(async (agentId) => {
        const agent = await this.agentRuntime.getAgent(workspaceId, agentId);
        const version =
          agent.liveVersionId === null
            ? null
            : await this.agentRuntime.getVersion(workspaceId, agent.liveVersionId);
        return [agentId, { name: agent.name, version: version?.number ?? 0 }] as const;
      }),
    );
    return new Map(entries);
  }

  private async userNames(ids: readonly (string | null)[]): Promise<ReadonlyMap<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => id !== null))];
    const users = await this.users.findNames(unique);
    return new Map(users.map((user) => [user.id, user.name]));
  }

  private summaryOf(
    conversation: Conversation,
    preview: Message | null,
    agents: ReadonlyMap<string, InboxAgentInfo>,
    userId: string,
    names: ReadonlyMap<string, string>,
    hasBeenHandled: boolean,
  ): InboxSummary {
    const agent = agents.get(conversation.agentId);
    return {
      id: this.ids.toPublic(IdPrefix.Conversation, conversation.id),
      state: conversation.state,
      handledByMe: conversation.handledBy === userId,
      handledByName:
        conversation.handledBy === null ? null : (names.get(conversation.handledBy) ?? null),
      hasBeenHandled,
      channelKind: conversation.channelKind,
      channelId:
        conversation.channelId === null
          ? null
          : this.ids.toPublic(IdPrefix.Channel, conversation.channelId),
      channelRef: conversation.channelId,
      agentId: this.ids.toPublic(IdPrefix.Agent, conversation.agentId),
      agentName: agent?.name ?? '',
      agentVersion: agent?.version ?? 0,
      endUserName: conversation.endUserName,
      endUserExternalId: conversation.endUserExternalId,
      preview: preview?.text ?? '',
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
      lastEscalatedAt: conversation.lastEscalatedAt,
      waitingSince: conversation.waitingSince,
      closedAt: conversation.closedAt,
    };
  }
}
