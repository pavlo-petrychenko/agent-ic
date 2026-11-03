import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_SEARCH_RATE_LIMIT } from '@/modules/knowledge/constants/knowledge-search.constants';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { searchKnowledgeInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSearchService } from '@/modules/knowledge/services/knowledge-search.service';
import type {
  KnowledgeSearchInput,
  KnowledgeSearchResult,
} from '@/modules/knowledge/typedefs/knowledge-search.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class SearchKnowledgeUseCase {
  constructor(
    private readonly rateLimits: RateLimitService,
    private readonly ids: IdService,
    private readonly search: KnowledgeSearchService,
  ) {}

  async execute(ctx: UseCaseCtx, input: KnowledgeSearchInput): Promise<KnowledgeSearchResult[]> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.View,
    );
    const parsed = parseKnowledgeInput(searchKnowledgeInputSchema, input);
    await this.rateLimits.enforce(KNOWLEDGE_SEARCH_RATE_LIMIT, workspaceId);
    return this.search.search({
      workspaceId,
      knowledgeBaseId: this.ids.fromPublic(IdPrefix.KnowledgeBase, parsed.knowledgeBaseId),
      query: parsed.query,
      topK: parsed.topK,
    });
  }
}
