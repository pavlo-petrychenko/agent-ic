import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, max } from 'drizzle-orm';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import type {
  AgentVersion,
  DraftChanges,
  NewAgentVersion,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class AgentVersionsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(version: NewAgentVersion): Promise<void> {
    await this.txHost.tx.insert(agentVersions).values(version);
  }

  async findById(workspaceId: string, versionId: string): Promise<AgentVersion | null> {
    const [version] = await this.txHost.tx
      .select()
      .from(agentVersions)
      .where(and(eq(agentVersions.workspaceId, workspaceId), eq(agentVersions.id, versionId)));
    return version ?? null;
  }

  async findDraft(workspaceId: string, agentId: string): Promise<AgentVersion | null> {
    const [draft] = await this.txHost.tx
      .select()
      .from(agentVersions)
      .where(
        and(
          eq(agentVersions.workspaceId, workspaceId),
          eq(agentVersions.agentId, agentId),
          eq(agentVersions.kind, AgentVersionKind.Draft),
        ),
      );
    return draft ?? null;
  }

  listByAgent(workspaceId: string, agentId: string): Promise<AgentVersion[]> {
    return this.txHost.tx
      .select()
      .from(agentVersions)
      .where(and(eq(agentVersions.workspaceId, workspaceId), eq(agentVersions.agentId, agentId)))
      .orderBy(desc(agentVersions.id));
  }

  async lastPublishedNumber(workspaceId: string, agentId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ last: max(agentVersions.number) })
      .from(agentVersions)
      .where(and(eq(agentVersions.workspaceId, workspaceId), eq(agentVersions.agentId, agentId)));
    return row?.last ?? 0;
  }

  async updateDraft(
    workspaceId: string,
    versionId: string,
    changes: DraftChanges,
    updatedAt: Date,
  ): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(agentVersions)
      .set({ flow: changes.flow, note: changes.note, updatedAt })
      .where(
        and(
          eq(agentVersions.workspaceId, workspaceId),
          eq(agentVersions.id, versionId),
          eq(agentVersions.kind, AgentVersionKind.Draft),
        ),
      )
      .returning({ id: agentVersions.id });
    return updated.length > 0;
  }
}
