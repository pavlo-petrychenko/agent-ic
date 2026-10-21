import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, gt, inArray, sql } from 'drizzle-orm';
import { agents } from '@/modules/agents/db/agents.table';
import { agentNamesLockKey } from '@/modules/agents/helpers/agent-name.helpers';
import type { Agent, NewAgent } from '@/modules/agents/typedefs/agent.typedefs';
import type { PauseSettings } from '@/modules/agents/typedefs/pause-settings.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class AgentsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(agent: NewAgent): Promise<void> {
    await this.txHost.tx.insert(agents).values(agent);
  }

  async findById(workspaceId: string, agentId: string): Promise<Agent | null> {
    const [agent] = await this.txHost.tx
      .select()
      .from(agents)
      .where(and(eq(agents.workspaceId, workspaceId), eq(agents.id, agentId)));
    return agent ?? null;
  }

  async listByIds(workspaceId: string, agentIds: readonly string[]): Promise<Agent[]> {
    if (agentIds.length === 0) {
      return [];
    }
    return this.txHost.tx
      .select()
      .from(agents)
      .where(and(eq(agents.workspaceId, workspaceId), inArray(agents.id, [...agentIds])));
  }

  async findByIdForUpdate(workspaceId: string, agentId: string): Promise<Agent | null> {
    const [agent] = await this.txHost.tx
      .select()
      .from(agents)
      .where(and(eq(agents.workspaceId, workspaceId), eq(agents.id, agentId)))
      .for('update');
    return agent ?? null;
  }

  async lockNames(workspaceId: string): Promise<void> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${agentNamesLockKey(workspaceId)}))`,
    );
  }

  async findNamesStartingWith(workspaceId: string, prefix: string): Promise<string[]> {
    const rows = await this.txHost.tx
      .select({ name: agents.name })
      .from(agents)
      .where(and(eq(agents.workspaceId, workspaceId), sql`starts_with(${agents.name}, ${prefix})`));
    return rows.map((row) => row.name);
  }

  listPage(workspaceId: string, afterId: string | null, limit: number): Promise<Agent[]> {
    const inWorkspace = eq(agents.workspaceId, workspaceId);
    return this.txHost.tx
      .select()
      .from(agents)
      .where(afterId === null ? inWorkspace : and(inWorkspace, gt(agents.id, afterId)))
      .orderBy(asc(agents.id))
      .limit(limit);
  }

  rename(workspaceId: string, agentId: string, name: string, updatedAt: Date): Promise<boolean> {
    return this.update(workspaceId, agentId, { name, updatedAt });
  }

  setDescription(
    workspaceId: string,
    agentId: string,
    description: string | null,
    updatedAt: Date,
  ): Promise<boolean> {
    return this.update(workspaceId, agentId, { description, updatedAt });
  }

  setDraftVersion(
    workspaceId: string,
    agentId: string,
    draftVersionId: string | null,
    updatedAt: Date,
  ): Promise<boolean> {
    return this.update(workspaceId, agentId, { draftVersionId, updatedAt });
  }

  setLiveVersion(
    workspaceId: string,
    agentId: string,
    liveVersionId: string | null,
    updatedAt: Date,
  ): Promise<boolean> {
    return this.update(workspaceId, agentId, { liveVersionId, updatedAt });
  }

  setPause(
    workspaceId: string,
    agentId: string,
    pause: PauseSettings | null,
    updatedAt: Date,
  ): Promise<boolean> {
    return this.update(workspaceId, agentId, {
      pausedAt: pause?.pausedAt ?? null,
      pauseMode: pause?.mode ?? null,
      awayMessage: pause?.awayMessage ?? null,
      updatedAt,
    });
  }

  async delete(workspaceId: string, agentId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(agents)
      .where(and(eq(agents.workspaceId, workspaceId), eq(agents.id, agentId)))
      .returning({ id: agents.id });
    return deleted.length > 0;
  }

  private async update(
    workspaceId: string,
    agentId: string,
    changes: Partial<NewAgent>,
  ): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(agents)
      .set(changes)
      .where(and(eq(agents.workspaceId, workspaceId), eq(agents.id, agentId)))
      .returning({ id: agents.id });
    return updated.length > 0;
  }

  async deleteByWorkspace(workspaceId: string): Promise<void> {
    await this.txHost.tx.delete(agents).where(eq(agents.workspaceId, workspaceId));
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ total: count() })
      .from(agents)
      .where(eq(agents.workspaceId, workspaceId));
    return row?.total ?? 0;
  }
}
