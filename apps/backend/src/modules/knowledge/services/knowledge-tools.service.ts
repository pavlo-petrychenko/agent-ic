import {
  AGENT_RESERVED_TOOL_NAMES,
  IdPrefix,
  knowledgeToolFallbackDescription,
} from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import {
  KNOWLEDGE_TOOL_KNOWLEDGE_BASE_MISSING_MESSAGE,
  KNOWLEDGE_TOOL_SCOPE_NOT_FOUND_MESSAGE,
  KNOWLEDGE_TOOL_SEARCH_UNAVAILABLE_MESSAGE,
  KnowledgeToolErrorCode,
  knowledgeToolInputSchema,
} from '@/modules/knowledge/constants/knowledge-tool.constants';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { KnowledgeSearchService } from '@/modules/knowledge/services/knowledge-search.service';
import type { KnowledgeToolOutput } from '@/modules/knowledge/typedefs/knowledge-tool.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import type { LlmTool, LlmTools } from '@/platform/llm/typedefs/llm-gateway.typedefs';

@Injectable()
export class KnowledgeToolsService {
  private readonly logger = new Logger(KnowledgeToolsService.name);

  constructor(
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly search: KnowledgeSearchService,
    private readonly tenants: TenantTransactionService,
    private readonly ids: IdService,
  ) {}

  async toolsFor(
    workspaceId: string,
    publicKnowledgeBaseIds: readonly string[],
  ): Promise<LlmTools> {
    const internalIds = [
      ...new Set(
        publicKnowledgeBaseIds.flatMap((id) => {
          const knowledgeBaseId = this.ids.tryFromPublic(IdPrefix.KnowledgeBase, id);
          return knowledgeBaseId === null ? [] : [knowledgeBaseId];
        }),
      ),
    ];
    const knowledgeBases = await this.tenants.run(workspaceId, () =>
      this.knowledgeBases.findByIds(workspaceId, internalIds),
    );
    const tools: Record<string, LlmTool> = {};
    for (const knowledgeBase of knowledgeBases) {
      if (AGENT_RESERVED_TOOL_NAMES.some((name) => name === knowledgeBase.toolName)) {
        continue;
      }
      tools[knowledgeBase.toolName] = {
        description:
          knowledgeBase.toolDescription ?? knowledgeToolFallbackDescription(knowledgeBase.name),
        inputSchema: knowledgeToolInputSchema,
        execute: async (input: unknown): Promise<unknown> =>
          this.execute(workspaceId, knowledgeBase.id, knowledgeBase.name, input),
      };
    }
    return tools;
  }

  private async execute(
    workspaceId: string,
    knowledgeBaseId: string,
    knowledgeBaseName: string,
    input: unknown,
  ): Promise<KnowledgeToolOutput> {
    const parsed = knowledgeToolInputSchema.parse(input);
    const sourceId = this.internalId(IdPrefix.KnowledgeSource, parsed.source_id);
    const documentId = this.internalId(IdPrefix.KnowledgeDocument, parsed.document_id);
    if (sourceId === null || documentId === null) {
      return this.error(
        KnowledgeToolErrorCode.ScopeNotFound,
        KNOWLEDGE_TOOL_SCOPE_NOT_FOUND_MESSAGE,
      );
    }
    if (
      !(await this.tenants.run(workspaceId, () =>
        this.scopeBelongs(workspaceId, knowledgeBaseId, sourceId, documentId),
      ))
    ) {
      return this.error(
        KnowledgeToolErrorCode.ScopeNotFound,
        KNOWLEDGE_TOOL_SCOPE_NOT_FOUND_MESSAGE,
      );
    }
    try {
      const results = await this.search.search({
        workspaceId,
        knowledgeBaseId,
        query: parsed.query,
        topK: parsed.top_k,
        ...(sourceId === undefined ? {} : { sourceId }),
        ...(documentId === undefined ? {} : { documentId }),
      });
      return {
        found: results.length > 0,
        results: results.map((result) => ({
          document_id: result.documentId,
          document_title: result.documentTitle,
          source_id: result.sourceId,
          source_title: result.sourceTitle,
          path: result.path,
          text: result.text,
          score: result.score,
          url: result.url,
        })),
      };
    } catch (error) {
      if (error instanceof KnowledgeBaseNotFoundError) {
        return this.error(
          KnowledgeToolErrorCode.KnowledgeBaseMissing,
          KNOWLEDGE_TOOL_KNOWLEDGE_BASE_MISSING_MESSAGE,
        );
      }
      this.logger.warn(
        `knowledge search failed for "${knowledgeBaseName}": ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return this.error(
        KnowledgeToolErrorCode.SearchUnavailable,
        KNOWLEDGE_TOOL_SEARCH_UNAVAILABLE_MESSAGE,
      );
    }
  }

  private internalId(prefix: IdPrefix, publicId: string | undefined): string | null | undefined {
    if (publicId === undefined) {
      return undefined;
    }
    return this.ids.tryFromPublic(prefix, publicId);
  }

  private async scopeBelongs(
    workspaceId: string,
    knowledgeBaseId: string,
    sourceId: string | undefined,
    documentId: string | undefined,
  ): Promise<boolean> {
    if (sourceId !== undefined) {
      const source = await this.sources.findById(workspaceId, sourceId);
      if (source === null || source.kbId !== knowledgeBaseId) {
        return false;
      }
    }
    if (documentId !== undefined) {
      const document = await this.documents.findById(workspaceId, documentId);
      if (
        document === null ||
        document.kbId !== knowledgeBaseId ||
        (sourceId !== undefined && document.sourceId !== sourceId)
      ) {
        return false;
      }
    }
    return true;
  }

  private error(code: KnowledgeToolErrorCode, message: string): KnowledgeToolOutput {
    return { found: false, results: [], error: { code, message } };
  }
}
