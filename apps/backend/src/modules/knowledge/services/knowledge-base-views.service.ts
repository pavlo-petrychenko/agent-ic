import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import type {
  KnowledgeBase,
  KnowledgeBaseView,
} from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class KnowledgeBaseViewsService {
  constructor(private readonly ids: IdService) {}

  view(knowledgeBase: KnowledgeBase): KnowledgeBaseView {
    return {
      id: this.ids.toPublic(IdPrefix.KnowledgeBase, knowledgeBase.id),
      name: knowledgeBase.name,
      description: knowledgeBase.description,
      toolName: knowledgeBase.toolName,
      toolDescription: knowledgeBase.toolDescription,
      documentCount: knowledgeBase.documentCount,
      chunkCount: knowledgeBase.chunkCount,
      createdAt: knowledgeBase.createdAt,
      updatedAt: knowledgeBase.updatedAt,
    };
  }

  views(knowledgeBases: readonly KnowledgeBase[]): KnowledgeBaseView[] {
    return knowledgeBases.map((knowledgeBase) => this.view(knowledgeBase));
  }
}
