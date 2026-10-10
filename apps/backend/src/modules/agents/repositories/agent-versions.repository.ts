import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, max, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  AgentVersionAggregate,
  AgentVersionAlias,
  AgentVersionKind,
  NO_PUBLISHED_VERSIONS,
} from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import type {
  AgentVersion,
  DraftChanges,
  NewAgentVersion,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import type { AgentVersionSummary } from '@/modules/agents/typedefs/agent.typedefs';
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

  listPublished(workspaceId: string, agentId: string): Promise<AgentVersion[]> {
    return this.txHost.tx
      .select()
      .from(agentVersions)
      .where(
        and(
          eq(agentVersions.workspaceId, workspaceId),
          eq(agentVersions.agentId, agentId),
          eq(agentVersions.kind, AgentVersionKind.Published),
        ),
      )
      .orderBy(desc(agentVersions.number));
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
    expectedRevision: number,
    changes: DraftChanges,
    updatedAt: Date,
  ): Promise<number | null> {
    const [updated] = await this.txHost.tx
      .update(agentVersions)
      .set({
        flow: changes.flow,
        note: changes.note,
        authorId: changes.authorId,
        revision: sql`${agentVersions.revision} + 1`,
        updatedAt,
      })
      .where(
        and(
          eq(agentVersions.workspaceId, workspaceId),
          eq(agentVersions.id, versionId),
          eq(agentVersions.kind, AgentVersionKind.Draft),
          eq(agentVersions.revision, expectedRevision),
        ),
      )
      .returning({ revision: agentVersions.revision });
    return updated?.revision ?? null;
  }

  async setBaseVersion(
    workspaceId: string,
    draftId: string,
    baseVersionId: string | null,
  ): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(agentVersions)
      .set({ baseVersionId })
      .where(
        and(
          eq(agentVersions.workspaceId, workspaceId),
          eq(agentVersions.id, draftId),
          eq(agentVersions.kind, AgentVersionKind.Draft),
        ),
      )
      .returning({ id: agentVersions.id });
    return updated.length > 0;
  }

  async summarize(
    workspaceId: string,
    agentIds: readonly string[],
  ): Promise<AgentVersionSummary[]> {
    if (agentIds.length === 0) {
      return [];
    }
    const draft = alias(agentVersions, AgentVersionAlias.Draft);
    const live = alias(agentVersions, AgentVersionAlias.Live);
    const base = alias(agentVersions, AgentVersionAlias.Base);
    const published = this.txHost.tx
      .select({
        agentId: agentVersions.agentId,
        versionCount: count().as(AgentVersionAggregate.Count),
        lastNumber: max(agentVersions.number).as(AgentVersionAggregate.LastNumber),
      })
      .from(agentVersions)
      .where(
        and(
          eq(agentVersions.workspaceId, workspaceId),
          eq(agentVersions.kind, AgentVersionKind.Published),
          inArray(agentVersions.agentId, [...agentIds]),
        ),
      )
      .groupBy(agentVersions.agentId)
      .as(AgentVersionAlias.Published);
    return this.txHost.tx
      .select({
        agentId: agents.id,
        liveVersionNumber: live.number,
        lastVersionNumber:
          sql<number>`coalesce(${published.lastNumber}, ${NO_PUBLISHED_VERSIONS})`.mapWith(Number),
        versionCount:
          sql<number>`coalesce(${published.versionCount}, ${NO_PUBLISHED_VERSIONS})`.mapWith(
            Number,
          ),
        draftBaseVersionNumber: base.number,
        hasUnpublishedChanges: sql<boolean>`${live.id} is null or ${draft.flow} is distinct from ${live.flow}`,
      })
      .from(agents)
      .leftJoin(draft, eq(draft.id, agents.draftVersionId))
      .leftJoin(live, eq(live.id, agents.liveVersionId))
      .leftJoin(base, eq(base.id, draft.baseVersionId))
      .leftJoin(published, eq(published.agentId, agents.id))
      .where(and(eq(agents.workspaceId, workspaceId), inArray(agents.id, [...agentIds])));
  }
}
