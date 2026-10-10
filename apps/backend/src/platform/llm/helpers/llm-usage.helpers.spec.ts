import { describe, expect, it } from 'vitest';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LLM_UNMETERED_CREDITS } from '@/platform/llm/constants/llm-usage.constants';
import { creditsFor, usageReport } from '@/platform/llm/helpers/llm-usage.helpers';

const WORKSPACE_ID = 'ws_usage';
const TAGS = { traceName: 'route', workspaceId: WORKSPACE_ID };
const LUNA = LLM_CATALOG[LlmModelId.Gpt6Luna];
const MILLION_EACH = { inputTokens: 1_000_000, outputTokens: 1_000_000 };
const LUNA_MILLION_EACH_CREDITS = 600;

describe('creditsFor', () => {
  it('prices tokens at one credit per thousandth of a dollar', () => {
    expect(creditsFor(LUNA, MILLION_EACH)).toBeCloseTo(LUNA_MILLION_EACH_CREDITS);
  });
});

describe('usageReport', () => {
  it('meters a call on the platform provider', () => {
    expect(usageReport({ kind: LlmProviderKind.Platform }, TAGS, LUNA, MILLION_EACH)).toEqual({
      workspaceId: WORKSPACE_ID,
      source: LlmProviderKind.Platform,
      model: LlmModelId.Gpt6Luna,
      ...MILLION_EACH,
      credits: expect.closeTo(LUNA_MILLION_EACH_CREDITS),
      metered: true,
    });
  });

  it('does not meter a call on a workspace key', () => {
    const provider = { kind: LlmProviderKind.Workspace, workspaceId: WORKSPACE_ID } as const;

    expect(usageReport(provider, TAGS, LUNA, MILLION_EACH)).toMatchObject({
      source: LlmProviderKind.Workspace,
      credits: LLM_UNMETERED_CREDITS,
      metered: false,
    });
  });
});
