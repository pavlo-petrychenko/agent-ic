import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_TOOL_NAME_SHORT_SUFFIX_LENGTH } from '@/modules/knowledge/constants/knowledge-tool-name.constants';
import { KnowledgeBaseNameTakenError } from '@/modules/knowledge/errors/knowledge-base-name-taken.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import {
  knowledgeToolNameBase,
  knowledgeToolNameWithSuffix,
} from '@/modules/knowledge/helpers/knowledge-tool-name.helpers';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { createKnowledgeBaseInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import type {
  CreateKnowledgeBaseInput,
  KnowledgeBaseView,
} from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { EMBEDDING_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';

@Injectable()
export class CreateKnowledgeBaseUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly views: KnowledgeBaseViewsService,
    private readonly configService: ConfigService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateKnowledgeBaseInput): Promise<KnowledgeBaseView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(createKnowledgeBaseInputSchema, input);
    const knowledgeBaseId = this.ids.generate();
    const embeddingModel = this.configService.config.llm.embeddingModel;
    const embeddingDimensions = EMBEDDING_CATALOG[embeddingModel].dimensions;

    return this.tenantTransactions.run(workspaceId, async () => {
      await this.knowledgeBases.lockNames(workspaceId);
      if ((await this.knowledgeBases.findByName(workspaceId, parsed.name)) !== null) {
        throw new KnowledgeBaseNameTakenError();
      }
      const toolName = await this.toolName(workspaceId, parsed.name, knowledgeBaseId);
      return this.views.view(
        await this.knowledgeBases.insert({
          id: knowledgeBaseId,
          workspaceId,
          name: parsed.name,
          description: parsed.description,
          toolName,
          toolDescription: null,
          embeddingModel,
          embeddingDimensions,
          createdByUserId: userId,
        }),
      );
    });
  }

  private async toolName(
    workspaceId: string,
    name: string,
    knowledgeBaseId: string,
  ): Promise<string> {
    const base = knowledgeToolNameBase(name);
    if ((await this.knowledgeBases.findByToolName(workspaceId, base)) === null) {
      return base;
    }
    const compactId = knowledgeBaseId.replaceAll('-', '');
    const short = knowledgeToolNameWithSuffix(
      base,
      compactId.slice(0, KNOWLEDGE_TOOL_NAME_SHORT_SUFFIX_LENGTH),
    );
    if ((await this.knowledgeBases.findByToolName(workspaceId, short)) === null) {
      return short;
    }
    return knowledgeToolNameWithSuffix(base, compactId);
  }
}
