import { IdPrefix } from '@agent-ic/contracts';
import { ModelProviderKind } from '@agent-ic/flow';
import type { ModelRef } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { StepModelUnknownError } from '@/modules/runs/errors/step-model-unknown.error';
import { stepModel } from '@/modules/runs/helpers/llm-step.helpers';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { RUNS_TEST_START } from '@test/support/constants/runs-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';

const NODE_ID = 'node-agent';
const WORKSPACE_ID = 'workspace-step-model';
const KEY_MODEL = 'house-model-unknown-to-the-catalog';
const PURPOSE = LlmPurpose.Conversation;

describe('stepModel', () => {
  const ids = new IdService(new ManualClock(RUNS_TEST_START));

  it('runs a step without a model on the platform default', () => {
    expect(stepModel(NODE_ID, null, PURPOSE, WORKSPACE_ID, ids)).toEqual({
      provider: { kind: LlmProviderKind.Platform },
      model: LLM_DEFAULT_MODEL[PURPOSE],
    });
  });

  it('runs a platform model from the catalog', () => {
    const model: ModelRef = {
      provider: { kind: ModelProviderKind.Platform },
      model: LlmModelId.Gemma4,
    };

    expect(stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toEqual({
      provider: { kind: LlmProviderKind.Platform },
      model: LlmModelId.Gemma4,
    });
  });

  it('refuses a platform model that is not in the catalog', () => {
    const model: ModelRef = { provider: { kind: ModelProviderKind.Platform }, model: KEY_MODEL };

    expect(() => stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toThrow(
      StepModelUnknownError,
    );
  });

  it('runs any model id on a workspace key and passes the key by its internal id', () => {
    const keyId = ids.generate();
    const model: ModelRef = {
      provider: {
        kind: ModelProviderKind.Workspace,
        providerKeyId: ids.toPublic(IdPrefix.LlmKey, keyId),
      },
      model: KEY_MODEL,
    };

    expect(stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toEqual({
      provider: {
        kind: LlmProviderKind.Workspace,
        workspaceId: WORKSPACE_ID,
        providerKeyId: keyId,
      },
      model: KEY_MODEL,
    });
  });

  it('refuses a workspace key id of another kind', () => {
    const model: ModelRef = {
      provider: {
        kind: ModelProviderKind.Workspace,
        providerKeyId: ids.toPublic(IdPrefix.Prompt, ids.generate()),
      },
      model: KEY_MODEL,
    };

    expect(() => stepModel(NODE_ID, model, PURPOSE, WORKSPACE_ID, ids)).toThrow(InvalidIdError);
  });
});
