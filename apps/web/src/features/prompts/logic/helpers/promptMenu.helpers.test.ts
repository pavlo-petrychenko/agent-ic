import { WorkspaceRole } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import {
  canEditPrompt,
  promptMenuActions,
} from '@/features/prompts/logic/helpers/promptMenu.helpers';

describe('promptMenuActions', () => {
  it('offers every action to a role that manages prompts', () => {
    expect(canEditPrompt(WorkspaceRole.Builder)).toBe(true);
    expect(promptMenuActions(WorkspaceRole.Builder)).toEqual([
      PromptMenuAction.Rename,
      PromptMenuAction.Move,
      PromptMenuAction.Duplicate,
      PromptMenuAction.Delete,
    ]);
  });

  it('offers nothing to a role without prompt access', () => {
    expect(canEditPrompt(WorkspaceRole.Operator)).toBe(false);
    expect(promptMenuActions(WorkspaceRole.Operator)).toEqual([]);
    expect(promptMenuActions(null)).toEqual([]);
  });
});
