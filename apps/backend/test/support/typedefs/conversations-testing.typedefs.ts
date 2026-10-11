import type { TestingModule } from '@nestjs/testing';
import type { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import type { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import type { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import type { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';
import type { QueuesService } from '@/platform/queues/services/queues.service';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';

export interface ConversationsTestbed {
  readonly module: TestingModule;
  readonly clock: ManualClock;
  readonly ids: IdService;
  readonly tenants: TenantTransactionService;
  readonly conversations: ConversationsRepository;
  readonly messages: MessagesRepository;
  readonly history: ConversationHistoryService;
  readonly runs: ConversationRunsService;
  readonly incoming: IncomingMessagesService;
  readonly agents: AgentsRepository;
  readonly queues: QueuesService;
}

export interface TiedMessages {
  readonly earlier: Message;
  readonly middle: Message;
  readonly later: Message;
}
