import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { KNOWLEDGE_WRITE_BATCH_SIZE } from '@/modules/knowledge/constants/knowledge.constants';
import { sections } from '@/modules/knowledge/db/sections.table';
import type {
  NewSection,
  Section,
  SectionChanges,
} from '@/modules/knowledge/typedefs/section.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { rowBatches } from '@/platform/database/helpers/row-batch.helpers';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SectionsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(section: NewSection): Promise<Section> {
    return storedRow(
      await this.txHost.tx
        .insert(sections)
        .values({ ...section, createdAt: this.clock.now() })
        .returning(),
    );
  }

  async insertMany(sectionsToInsert: readonly NewSection[]): Promise<void> {
    const createdAt = this.clock.now();
    for (const batch of rowBatches(sectionsToInsert, KNOWLEDGE_WRITE_BATCH_SIZE)) {
      await this.txHost.tx
        .insert(sections)
        .values(batch.map((section) => ({ ...section, createdAt })));
    }
  }

  async findById(workspaceId: string, sectionId: string): Promise<Section | null> {
    const [section] = await this.txHost.tx
      .select()
      .from(sections)
      .where(and(eq(sections.workspaceId, workspaceId), eq(sections.id, sectionId)));
    return section ?? null;
  }

  async update(
    workspaceId: string,
    sectionId: string,
    changes: SectionChanges,
  ): Promise<Section | null> {
    const [section] = await this.txHost.tx
      .update(sections)
      .set(changes)
      .where(and(eq(sections.workspaceId, workspaceId), eq(sections.id, sectionId)))
      .returning();
    return section ?? null;
  }

  async deleteById(workspaceId: string, sectionId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(sections)
      .where(and(eq(sections.workspaceId, workspaceId), eq(sections.id, sectionId)))
      .returning({ id: sections.id });
    return deleted.length > 0;
  }

  async deleteByKnowledgeBase(workspaceId: string, knowledgeBaseId: string): Promise<number> {
    const deleted = await this.txHost.tx
      .delete(sections)
      .where(and(eq(sections.workspaceId, workspaceId), eq(sections.kbId, knowledgeBaseId)))
      .returning({ id: sections.id });
    return deleted.length;
  }

  async deleteByDocumentGeneration(
    workspaceId: string,
    documentId: string,
    generation: number,
  ): Promise<number> {
    const deleted = await this.txHost.tx
      .delete(sections)
      .where(
        and(
          eq(sections.workspaceId, workspaceId),
          eq(sections.documentId, documentId),
          eq(sections.generation, generation),
        ),
      )
      .returning({ id: sections.id });
    return deleted.length;
  }
}
