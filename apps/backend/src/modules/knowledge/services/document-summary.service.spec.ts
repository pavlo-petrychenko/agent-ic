import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_SUMMARY_SYSTEM_PROMPT,
  KNOWLEDGE_SUMMARY_TRACE_NAME,
} from '@/modules/knowledge/constants/knowledge-summary.constants';
import { buildDocumentSections } from '@/modules/knowledge/helpers/section-tree.helpers';
import { DocumentSummaryService } from '@/modules/knowledge/services/document-summary.service';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import type {
  LlmAgentResult,
  LlmCompleteRequest,
  LlmCompletion,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';

const TEST_WORKSPACE_ID = 'workspace-1';
const TEST_SUMMARY = 'A price list with services, prices and gift-card rules.';
const TEST_INPUT_TOKENS = 120;
const TEST_OUTPUT_TOKENS = 20;
const MARKDOWN = '# Pricing\n\nService prices.\n';

type ScriptedRequest = LlmCompleteRequest<Record<string, unknown>>;

class ScriptedLlmGateway extends LlmGateway {
  readonly requests: ScriptedRequest[] = [];

  async complete<T>(request: LlmCompleteRequest<T>): Promise<LlmCompletion<T>> {
    this.requests.push(request as ScriptedRequest);
    return {
      output: { summary: TEST_SUMMARY } as T,
      model: request.model,
      usage: { inputTokens: TEST_INPUT_TOKENS, outputTokens: TEST_OUTPUT_TOKENS },
    };
  }

  async runAgent<T>(): Promise<LlmAgentResult<T>> {
    throw new Error('The summary service never runs an agent');
  }
}

describe('DocumentSummaryService', () => {
  it('reuses an existing summary without calling the model', async () => {
    const gateway = new ScriptedLlmGateway();
    const service = new DocumentSummaryService(gateway);

    const result = await service.generate({
      workspaceId: TEST_WORKSPACE_ID,
      title: 'Handbook',
      markdown: MARKDOWN,
      sections: buildDocumentSections(MARKDOWN),
      existingSummary: '  Gift-card rules.  ',
    });

    expect(result).toEqual({
      summary: 'Gift-card rules.',
      generated: false,
      warnings: [],
    });
    expect(gateway.requests).toHaveLength(0);
  });

  it('generates one summary with the light model', async () => {
    const gateway = new ScriptedLlmGateway();
    const service = new DocumentSummaryService(gateway);

    const result = await service.generate({
      workspaceId: TEST_WORKSPACE_ID,
      title: 'Handbook',
      markdown: MARKDOWN,
      sections: buildDocumentSections(MARKDOWN),
      existingSummary: null,
    });

    expect(result).toMatchObject({
      summary: TEST_SUMMARY,
      generated: true,
      warnings: [],
    });
    expect(gateway.requests).toHaveLength(1);
    expect(gateway.requests[0]).toMatchObject({
      provider: { kind: LlmProviderKind.Platform },
      model: LLM_DEFAULT_MODEL[LlmPurpose.Light],
      purpose: LlmPurpose.Light,
      system: KNOWLEDGE_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: LlmMessageRole.User }],
      tags: { traceName: KNOWLEDGE_SUMMARY_TRACE_NAME, workspaceId: TEST_WORKSPACE_ID },
    });
    expect(gateway.requests[0]?.messages[0]?.content).toContain('Title: Handbook');
    expect(gateway.requests[0]?.messages[0]?.content).toContain('Service prices.');
  });
});
