import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { TEMPLATE_PROMPT_WRITER } from '@/modules/agents/constants/agent-template.constants';
import { InvalidTemplatePromptWriterError } from '@/modules/agents/errors/invalid-template-prompt-writer.error';
import { TemplatePromptWriterCountError } from '@/modules/agents/errors/template-prompt-writer-count.error';
import { TemplatePromptWriter } from '@/modules/agents/services/template-prompt-writer.service';
import type {
  TemplatePromptRefs,
  TemplatePromptRequest,
} from '@/modules/agents/typedefs/agent-template.typedefs';

@Injectable()
export class TemplatePromptsService implements OnModuleInit {
  private writers: readonly TemplatePromptWriter[] = [];

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    this.writers = this.discovery
      .getProviders()
      .filter((wrapper) => wrapper.token === TEMPLATE_PROMPT_WRITER)
      .map(({ instance }: { instance: unknown }) => {
        if (instance instanceof TemplatePromptWriter) {
          return instance;
        }
        throw new InvalidTemplatePromptWriterError();
      });
  }

  ensure(workspaceId: string, request: TemplatePromptRequest): Promise<TemplatePromptRefs> {
    const [writer, ...others] = this.writers;
    if (writer === undefined || others.length > 0) {
      throw new TemplatePromptWriterCountError();
    }
    return writer.ensure(workspaceId, request);
  }
}
