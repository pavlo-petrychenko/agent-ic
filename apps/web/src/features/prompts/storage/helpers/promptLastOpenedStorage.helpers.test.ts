import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROMPT_LAST_OPENED_KEY_SEPARATOR,
  PROMPT_LAST_OPENED_STORAGE_KEY_PREFIX,
} from '@/features/prompts/constants/promptLastOpened.constants';
import {
  readLastOpenedPromptId,
  storeLastOpenedPromptId,
} from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';

describe('prompt last opened storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('round-trips the last opened prompt', () => {
    storeLastOpenedPromptId('ws_1', 'prm_1');

    expect(readLastOpenedPromptId('ws_1')).toBe('prm_1');
    expect(
      window.localStorage.getItem(
        `${PROMPT_LAST_OPENED_STORAGE_KEY_PREFIX}${PROMPT_LAST_OPENED_KEY_SEPARATOR}ws_1`,
      ),
    ).toBe('prm_1');
  });

  it('reads null for an unknown workspace', () => {
    expect(readLastOpenedPromptId('ws_missing')).toBeNull();
  });

  it('keeps workspaces apart', () => {
    storeLastOpenedPromptId('ws_1', 'prm_1');
    storeLastOpenedPromptId('ws_2', 'prm_2');

    expect(readLastOpenedPromptId('ws_1')).toBe('prm_1');
    expect(readLastOpenedPromptId('ws_2')).toBe('prm_2');
  });
});
