import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { sections } from '@/modules/knowledge/db/sections.table';
import type {
  NewSection,
  Section,
  SectionChanges,
} from '@/modules/knowledge/typedefs/section.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
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
}
