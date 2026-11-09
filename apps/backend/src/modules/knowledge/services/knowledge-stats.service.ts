import { Injectable } from '@nestjs/common';
import { KnowledgeStatsRepository } from '@/modules/knowledge/repositories/knowledge-stats.repository';
import { KnowledgeChunksReader } from '@/modules/usage';

@Injectable()
export class KnowledgeStatsService extends KnowledgeChunksReader {
  constructor(private readonly stats: KnowledgeStatsRepository) {
    super();
  }

  workspaceChunkCount(workspaceId: string): Promise<number> {
    return this.stats.workspaceChunkCount(workspaceId);
  }
}
