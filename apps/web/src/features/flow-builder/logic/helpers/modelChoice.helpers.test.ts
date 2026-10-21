import { ModelProviderKind } from '@agent-ic/flow';
import type { ModelRef } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  choiceKey,
  modelRefOf,
  parseChoiceKey,
  refChoiceKey,
} from '@/features/flow-builder/logic/helpers/modelChoice.helpers';

const KEY_ID = 'lmk_01own';

describe('model choice helpers', () => {
  it('builds a key from the source and the model', () => {
    expect(choiceKey({ providerKeyId: null, model: 'gpt-6-luna' })).toBe('platform:gpt-6-luna');
    expect(choiceKey({ providerKeyId: KEY_ID, model: 'gpt-4o' })).toBe('lmk_01own:gpt-4o');
  });

  it('reads a key back, keeping separators inside the model id', () => {
    expect(parseChoiceKey('platform:gpt-6-luna')).toEqual({
      providerKeyId: null,
      model: 'gpt-6-luna',
    });
    expect(parseChoiceKey('lmk_01own:llama3:8b')).toEqual({
      providerKeyId: KEY_ID,
      model: 'llama3:8b',
    });
  });

  it('rejects a key without a source or a model', () => {
    expect(parseChoiceKey('gpt-4o')).toBeNull();
    expect(parseChoiceKey(':gpt-4o')).toBeNull();
    expect(parseChoiceKey('platform:')).toBeNull();
  });

  it('turns a stored model into a key and back', () => {
    const platform: ModelRef = {
      provider: { kind: ModelProviderKind.Platform },
      model: 'gpt-6-luna',
    };
    const workspace: ModelRef = {
      provider: { kind: ModelProviderKind.Workspace, providerKeyId: KEY_ID },
      model: 'gpt-4o',
    };

    expect(modelRefOf(refChoiceKey(platform))).toEqual(platform);
    expect(modelRefOf(refChoiceKey(workspace))).toEqual(workspace);
  });
});
