import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { TEMPLATE_KNOWLEDGE_BASE_WRITER } from '@/modules/agents/constants/agent-template.constants';
import { InvalidTemplateKnowledgeBaseWriterError } from '@/modules/agents/errors/invalid-template-knowledge-base-writer.error';
import { TemplateKnowledgeBaseWriterCountError } from '@/modules/agents/errors/template-knowledge-base-writer-count.error';
import { TemplateKnowledgeBaseWriter } from '@/modules/agents/services/template-knowledge-base-writer.service';
import type { TemplateKnowledgeBaseRequest } from '@/modules/agents/typedefs/agent-template.typedefs';

@Injectable()
export class TemplateKnowledgeBasesService implements OnModuleInit {
  private writers: readonly TemplateKnowledgeBaseWriter[] = [];

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    this.writers = this.discovery
      .getProviders()
      .filter((wrapper) => wrapper.token === TEMPLATE_KNOWLEDGE_BASE_WRITER)
      .map(({ instance }: { instance: unknown }) => {
        if (instance instanceof TemplateKnowledgeBaseWriter) {
          return instance;
        }
        throw new InvalidTemplateKnowledgeBaseWriterError();
      });
  }

  create(workspaceId: string, request: TemplateKnowledgeBaseRequest): Promise<string> {
    const [writer, ...others] = this.writers;
    if (writer === undefined || others.length > 0) {
      throw new TemplateKnowledgeBaseWriterCountError();
    }
    return writer.create(workspaceId, request);
  }
}
