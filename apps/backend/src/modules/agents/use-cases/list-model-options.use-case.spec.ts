import { WorkspaceRole } from '@agent-ic/contracts';
import { ModelProviderKind } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { ListModelOptionsUseCase } from '@/modules/agents/use-cases/list-model-options.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { LLM_CATALOG, LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';

const models = Object.values(LLM_CATALOG);

describe('ListModelOptionsUseCase', () => {
  const listModelOptions = new ListModelOptionsUseCase();
  const builderCtx = workspaceCtx(TEST_EDITOR_ID, TEST_EDITOR_ID, WorkspaceRole.Builder);
  const operatorCtx = workspaceCtx(TEST_EDITOR_ID, TEST_EDITOR_ID, WorkspaceRole.Operator);

  it('lists every catalog model once', () => {
    const options = listModelOptions.execute(builderCtx);

    expect(options.map((option) => option.id)).toEqual(models.map((model) => model.id));
  });

  it.each(models)('lists $id with its levels, default level, vendor and price', (model) => {
    const option = listModelOptions.execute(builderCtx).find(({ id }) => id === model.id);

    expect(option).toEqual({
      id: model.id,
      label: model.label,
      vendor: model.vendor,
      source: ModelProviderKind.Platform,
      purposes: model.purposes,
      defaultFor: expect.any(Array),
      price: model.price,
      reasoningLevels: model.reasoningLevels,
      defaultReasoningLevel: model.reasoningEffort,
    });
  });

  it.each(Object.values(LlmPurpose))('marks one model as the default for %s', (purpose) => {
    const defaults = listModelOptions
      .execute(builderCtx)
      .filter((option) => option.defaultFor.includes(purpose));

    expect(defaults.map((option) => option.id)).toEqual([LLM_DEFAULT_MODEL[purpose]]);
  });

  it('refuses an operator', () => {
    const attempt = () => listModelOptions.execute(operatorCtx);

    expect(attempt).toThrow(PermissionDeniedError);
  });
});
