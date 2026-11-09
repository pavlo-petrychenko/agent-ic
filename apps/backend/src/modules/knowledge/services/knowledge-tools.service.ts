import {
  AGENT_RESERVED_TOOL_NAMES,
  IdPrefix,
  knowledgeToolFallbackDescription,
} from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import {
  KNOWLEDGE_TOOL_KNOWLEDGE_BASE_MISSING_MESSAGE,
  KNOWLEDGE_TOOL_SEARCH_UNAVAILABLE_MESSAGE,
  KnowledgeToolErrorCode,
  knowledgeToolInputSchema,
} from '@/modules/knowledge/constants/knowledge-tool.constants';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import {
  isKnowledgeToolFailure,
  presentScopeId,
} from '@/modules/knowledge/helpers/knowledge-tool.helpers';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { KnowledgeSearchService } from '@/modules/knowledge/services/knowledge-search.service';
import type {
  KnowledgeToolOutput,
  KnowledgeToolScope,
} from '@/modules/knowledge/typedefs/knowledge-tool.typedefs';
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
        failed: isKnowledgeToolFailure,
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
    const scope = await this.tenants.run(workspaceId, () =>
      this.resolveScope(workspaceId, knowledgeBaseId, knowledgeBaseName, parsed),
    );
    try {
      const results = await this.search.search({
        workspaceId,
        knowledgeBaseId,
        query: parsed.query,
        topK: parsed.top_k,
        ...(scope.sourceId === null ? {} : { sourceId: scope.sourceId }),
        ...(scope.documentId === null ? {} : { documentId: scope.documentId }),
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

  private async resolveScope(
    workspaceId: string,
    knowledgeBaseId: string,
    knowledgeBaseName: string,
    input: { readonly source_id?: string | null; readonly document_id?: string | null },
  ): Promise<KnowledgeToolScope> {
    const sourceId = await this.resolveSourceId(
      workspaceId,
      knowledgeBaseId,
      knowledgeBaseName,
      presentScopeId(input.source_id),
    );
    const documentId = await this.resolveDocumentId(
      workspaceId,
      knowledgeBaseId,
      knowledgeBaseName,
      presentScopeId(input.document_id),
      sourceId,
    );
    return { sourceId, documentId };
  }

  private async resolveSourceId(
    workspaceId: string,
    knowledgeBaseId: string,
    knowledgeBaseName: string,
    publicId: string | null,
  ): Promise<string | null> {
    if (publicId === null) {
      return null;
    }
    const sourceId = this.ids.tryFromPublic(IdPrefix.KnowledgeSource, publicId);
    const source = sourceId === null ? null : await this.sources.findById(workspaceId, sourceId);
    if (sourceId === null || source === null || source.kbId !== knowledgeBaseId) {
      this.logIgnoredScope(knowledgeBaseName, 'source_id', publicId);
      return null;
    }
    return sourceId;
  }

  private async resolveDocumentId(
    workspaceId: string,
    knowledgeBaseId: string,
    knowledgeBaseName: string,
    publicId: string | null,
    sourceId: string | null,
  ): Promise<string | null> {
    if (publicId === null) {
      return null;
    }
    const documentId = this.ids.tryFromPublic(IdPrefix.KnowledgeDocument, publicId);
    const document =
      documentId === null ? null : await this.documents.findById(workspaceId, documentId);
    if (
      documentId === null ||
      document === null ||
      document.kbId !== knowledgeBaseId ||
      (sourceId !== null && document.sourceId !== sourceId)
    ) {
      this.logIgnoredScope(knowledgeBaseName, 'document_id', publicId);
      return null;
    }
    return documentId;
  }

  private logIgnoredScope(knowledgeBaseName: string, field: string, value: string): void {
    this.logger.warn(
      `knowledge search on "${knowledgeBaseName}" ignored ${field} "${value}": not in this knowledge base`,
    );
  }

  private error(code: KnowledgeToolErrorCode, message: string): KnowledgeToolOutput {
    return { found: false, results: [], error: { code, message } };
  }
}
