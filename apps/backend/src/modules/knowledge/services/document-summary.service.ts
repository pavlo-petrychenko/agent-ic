import { Injectable } from '@nestjs/common';
import {
  KNOWLEDGE_SUMMARY_SYSTEM_PROMPT,
  KNOWLEDGE_SUMMARY_TRACE_NAME,
} from '@/modules/knowledge/constants/knowledge-summary.constants';
import { documentSummaryContent } from '@/modules/knowledge/helpers/document-summary.helpers';
import { documentSummaryOutputSchema } from '@/modules/knowledge/schemas/document-summary.schema';
import type {
  DocumentSummaryInput,
  DocumentSummaryResult,
} from '@/modules/knowledge/typedefs/document-summary.typedefs';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';

@Injectable()
export class DocumentSummaryService {
  constructor(private readonly llm: LlmGateway) {}

  async generate(input: DocumentSummaryInput): Promise<DocumentSummaryResult> {
    const existing = input.existingSummary?.trim() ?? '';
    if (existing.length > 0) {
      return {
        summary: existing,
        generated: false,
        warnings: [],
      };
    }

    const content = documentSummaryContent(input.title, input.markdown, input.sections);
    const completion = await this.llm.complete({
      provider: { kind: LlmProviderKind.Platform },
      model: LLM_DEFAULT_MODEL[LlmPurpose.Light],
      purpose: LlmPurpose.Light,
      system: KNOWLEDGE_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: LlmMessageRole.User, content: content.content }],
      output: documentSummaryOutputSchema,
      tags: {
        traceName: KNOWLEDGE_SUMMARY_TRACE_NAME,
        workspaceId: input.workspaceId,
      },
    });
    return {
      summary: completion.output.summary,
      generated: true,
      warnings: content.warnings,
    };
  }
}
