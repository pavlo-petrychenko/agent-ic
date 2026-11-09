import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { TemplateKnowledgeBaseWriter } from '@/modules/agents';
import type { TemplateKnowledgeBaseRequest } from '@/modules/agents';
import { KnowledgeBaseCreatorService } from '@/modules/knowledge/services/knowledge-base-creator.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class KnowledgeTemplateWriter extends TemplateKnowledgeBaseWriter {
  constructor(
    private readonly creator: KnowledgeBaseCreatorService,
    private readonly ids: IdService,
  ) {
    super();
  }

  async create(workspaceId: string, request: TemplateKnowledgeBaseRequest): Promise<string> {
    const knowledgeBase = await this.creator.createWithFreeName({
      workspaceId,
      name: request.name,
      description: null,
      createdByUserId: request.authorId,
    });
    return this.ids.toPublic(IdPrefix.KnowledgeBase, knowledgeBase.id);
  }
}
