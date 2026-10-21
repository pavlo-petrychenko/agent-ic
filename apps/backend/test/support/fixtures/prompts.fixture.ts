import { FIRST_PROMPT_VERSION_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import type { NewPromptFolder } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { NewPromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { NewPrompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import {
  TEST_FOLDER_NAME,
  TEST_PROMPT_NAME,
  TEST_PROMPT_NOTE,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';

export const newFolder = (
  id: string,
  workspaceId: string,
  overrides: Partial<NewPromptFolder> = {},
): NewPromptFolder => ({
  id,
  workspaceId,
  name: TEST_FOLDER_NAME,
  ...overrides,
});

export const newPrompt = (
  id: string,
  workspaceId: string,
  folderId: string,
  overrides: Partial<NewPrompt> = {},
): NewPrompt => ({
  id,
  workspaceId,
  folderId,
  name: TEST_PROMPT_NAME,
  createdByUserId: null,
  ...overrides,
});

export const newPromptVersion = (
  id: string,
  workspaceId: string,
  promptId: string,
  overrides: Partial<NewPromptVersion> = {},
): NewPromptVersion => ({
  id,
  workspaceId,
  promptId,
  number: FIRST_PROMPT_VERSION_NUMBER,
  text: TEST_PROMPT_TEXT,
  note: TEST_PROMPT_NOTE,
  authorId: null,
  ...overrides,
});
