import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notExists,
  or,
  sql,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  CloseReason,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { messages } from '@/modules/conversations/db/messages.table';
import { scheduleContacts } from '@/modules/conversations/db/schedule-contacts.table';
import { neverEscalated } from '@/modules/conversations/helpers/conversation-escalation.helpers';
import {
  endUserLockKey,
  simulationLockKey,
} from '@/modules/conversations/helpers/incoming-message.helpers';
import type { InactivityScope } from '@/modules/conversations/typedefs/auto-close.typedefs';
import type {
  Conversation,
  EndUserConversationKey,
  NewConversation,
  SimulationKey,
} from '@/modules/conversations/typedefs/conversation.typedefs';
import type { ScheduleCandidateQuery } from '@/modules/conversations/typedefs/schedule-audience.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ConversationsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(conversation: NewConversation): Promise<Conversation> {
    return storedRow(
      await this.txHost.tx
        .insert(conversations)
        .values({ ...conversation, createdAt: this.clock.now() })
        .returning(),
    );
  }

  async findById(workspaceId: string, id: string): Promise<Conversation | null> {
    const [conversation] = await this.txHost.tx
      .select()
      .from(conversations)
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, id)));
    return conversation ?? null;
  }

  async findOpenForUpdate(key: EndUserConversationKey): Promise<Conversation | null> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${endUserLockKey(key)}))`,
    );
    const [conversation] = await this.txHost.tx
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, key.workspaceId),
          eq(conversations.agentId, key.agentId),
          eq(conversations.channelKind, key.channelKind),
          eq(conversations.endUserExternalId, key.endUserExternalId),
          eq(conversations.mode, key.mode),
          ne(conversations.state, ConversationState.Closed),
        ),
      )
      .orderBy(desc(conversations.createdAt))
      .limit(1)
      .for('update');
    return conversation ?? null;
  }

  async findScheduleCandidates(
    workspaceId: string,
    query: ScheduleCandidateQuery,
  ): Promise<Conversation[]> {
    if (query.channelKinds.length === 0) {
      return [];
    }
    const contacted = this.txHost.tx
      .select({ id: scheduleContacts.id })
      .from(scheduleContacts)
      .where(
        and(
          eq(scheduleContacts.workspaceId, conversations.workspaceId),
          eq(scheduleContacts.conversationId, conversations.id),
          eq(scheduleContacts.agentId, query.agentId),
          eq(scheduleContacts.nodeId, query.nodeId),
          ...(query.oncePerConversation
            ? []
            : [
                or(
                  eq(scheduleContacts.scheduledFor, query.tick),
                  gte(scheduleContacts.scheduledFor, conversations.lastCustomerMessageAt),
                ),
              ]),
        ),
      );
    return this.txHost.tx
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.agentId, query.agentId),
          eq(conversations.mode, ConversationMode.Live),
          eq(conversations.state, ConversationState.AgentActive),
          isNull(conversations.activeRunId),
          isNotNull(conversations.lastCustomerMessageAt),
          inArray(conversations.channelKind, [...query.channelKinds]),
          ...(query.silentSince === null
            ? []
            : [lte(conversations.lastCustomerMessageAt, query.silentSince)]),
          ...(query.notEscalated ? [neverEscalated()] : []),
          notExists(contacted),
        ),
      )
      .orderBy(asc(conversations.lastCustomerMessageAt), asc(conversations.id))
      .limit(query.limit);
  }

  async findOpenSimulation(key: SimulationKey): Promise<Conversation | null> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${simulationLockKey(key)}))`,
    );
    const [conversation] = await this.simulationQuery(
      key,
      ne(conversations.state, ConversationState.Closed),
    ).for('update');
    return conversation ?? null;
  }

  async findLatestSimulation(key: SimulationKey): Promise<Conversation | null> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${simulationLockKey(key)}))`,
    );
    const [conversation] = await this.simulationQuery(key).for('update');
    return conversation ?? null;
  }

  async findLatestSimulationForRead(key: SimulationKey): Promise<Conversation | null> {
    const [conversation] = await this.simulationQuery(key);
    return conversation ?? null;
  }

  async claimAwayMessage(
    workspaceId: string,
    id: string,
    pausedAt: Date,
    sentAt: Date,
  ): Promise<boolean> {
    const claimed = await this.txHost.tx
      .update(conversations)
      .set({ awaySentAt: sentAt })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          or(isNull(conversations.awaySentAt), lt(conversations.awaySentAt, pausedAt)),
        ),
      )
      .returning({ id: conversations.id });
    return claimed.length > 0;
  }

  async lockIdle(workspaceId: string, id: string): Promise<boolean> {
    const locked = await this.txHost.tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          isNull(conversations.activeRunId),
        ),
      )
      .for('update');
    return locked.length > 0;
  }

  async claim(workspaceId: string, id: string, runId: string): Promise<boolean> {
    const claimed = await this.txHost.tx
      .update(conversations)
      .set({ activeRunId: runId })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          isNull(conversations.activeRunId),
        ),
      )
      .returning({ id: conversations.id });
    return claimed.length > 0;
  }

  async release(workspaceId: string, id: string, runId: string): Promise<boolean> {
    const released = await this.txHost.tx
      .update(conversations)
      .set({ activeRunId: null })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          eq(conversations.activeRunId, runId),
        ),
      )
      .returning({ id: conversations.id });
    return released.length > 0;
  }

  async markWaiting(workspaceId: string, id: string): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(conversations)
      .set({ state: ConversationState.Waiting, lastEscalatedAt: this.clock.now() })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          eq(conversations.state, ConversationState.AgentActive),
        ),
      )
      .returning({ id: conversations.id });
    return updated.length > 0;
  }

  async takeOver(workspaceId: string, id: string, userId: string): Promise<void> {
    await this.txHost.tx
      .update(conversations)
      .set({ state: ConversationState.Handled, handledBy: userId })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          ne(conversations.state, ConversationState.Closed),
        ),
      );
  }

  async handBack(workspaceId: string, id: string): Promise<Conversation | null> {
    const [conversation] = await this.txHost.tx
      .update(conversations)
      .set({ state: ConversationState.AgentActive, handledBy: null })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          inArray(conversations.state, [ConversationState.Waiting, ConversationState.Handled]),
        ),
      )
      .returning();
    return conversation ?? null;
  }

  async close(
    workspaceId: string,
    id: string,
    closedAt: Date,
    closeReason: CloseReason | null,
  ): Promise<boolean> {
    const closed = await this.txHost.tx
      .update(conversations)
      .set({ state: ConversationState.Closed, closedAt, closeReason })
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.id, id),
          ne(conversations.state, ConversationState.Closed),
        ),
      )
      .returning({ id: conversations.id });
    return closed.length > 0;
  }

  async closeInactive(
    workspaceId: string,
    scopes: readonly InactivityScope[],
    closedAt: Date,
    limit: number,
  ): Promise<string[]> {
    if (scopes.length === 0) {
      return [];
    }
    const locked = await this.txHost.tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(this.inactive(workspaceId, scopes))
      .limit(limit)
      .for('update', { skipLocked: true });
    if (locked.length === 0) {
      return [];
    }
    const closed = await this.txHost.tx
      .update(conversations)
      .set({ state: ConversationState.Closed, closedAt, closeReason: CloseReason.Inactivity })
      .where(
        and(
          inArray(
            conversations.id,
            locked.map(({ id }) => id),
          ),
          this.inactive(workspaceId, scopes),
        ),
      )
      .returning({ id: conversations.id });
    return closed.map(({ id }) => id);
  }

  async recordCustomerMessage(workspaceId: string, id: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(conversations)
      .set({ lastMessageAt: at, lastCustomerMessageAt: at })
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, id)));
  }

  async touch(workspaceId: string, id: string, lastMessageAt: Date): Promise<void> {
    await this.txHost.tx
      .update(conversations)
      .set({ lastMessageAt })
      .where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.id, id)));
  }

  private inactive(workspaceId: string, scopes: readonly InactivityScope[]): SQL | undefined {
    return and(
      eq(conversations.workspaceId, workspaceId),
      eq(conversations.state, ConversationState.AgentActive),
      isNull(conversations.activeRunId),
      or(...scopes.map((scope) => this.silentIn(scope))),
    );
  }

  private silentIn(scope: InactivityScope): SQL | undefined {
    return and(
      eq(conversations.agentId, scope.agentId),
      eq(conversations.mode, scope.mode),
      scope.simulationVersionId === null
        ? isNull(conversations.simulationVersionId)
        : eq(conversations.simulationVersionId, scope.simulationVersionId),
      lt(conversations.createdAt, scope.silentSince),
      notExists(
        this.txHost.tx
          .select({ id: messages.id })
          .from(messages)
          .where(
            and(
              eq(messages.workspaceId, conversations.workspaceId),
              eq(messages.conversationId, conversations.id),
              eq(messages.author, MessageAuthor.Customer),
              gte(messages.createdAt, scope.silentSince),
            ),
          ),
      ),
    );
  }

  private simulationQuery(key: SimulationKey, ...conditions: SQL[]) {
    return this.txHost.tx
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, key.workspaceId),
          eq(conversations.agentId, key.agentId),
          eq(conversations.endUserExternalId, key.endUserExternalId),
          eq(conversations.mode, ConversationMode.Simulation),
          ...conditions,
        ),
      )
      .orderBy(desc(conversations.createdAt))
      .limit(1);
  }
}
