import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { KNOWLEDGE_CHUNKS_UNTRACKED } from '@/modules/usage/constants/usage.constants';
import { KnowledgeChunksReader } from '@/modules/usage/services/knowledge-chunks-reader.service';

@Injectable()
export class KnowledgeChunksService implements OnModuleInit {
  private reader: KnowledgeChunksReader | null = null;

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    const found: unknown = this.discovery
      .getProviders()
      .find((wrapper) => wrapper.token === KnowledgeChunksReader)?.instance;
    this.reader = found instanceof KnowledgeChunksReader ? found : null;
  }

  async workspaceChunks(workspaceId: string): Promise<number> {
    return (await this.reader?.workspaceChunkCount(workspaceId)) ?? KNOWLEDGE_CHUNKS_UNTRACKED;
  }
}
