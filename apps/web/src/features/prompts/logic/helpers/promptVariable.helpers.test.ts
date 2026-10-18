import { libraryVariables } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { PromptVariableGroup } from '@/features/prompts/constants/promptVariable.constants';
import {
  promptVariableGroup,
  promptVariableOptions,
} from '@/features/prompts/logic/helpers/promptVariable.helpers';

describe('promptVariableGroup', () => {
  it('names where a variable comes from', () => {
    expect(promptVariableGroup('user.name')).toBe(PromptVariableGroup.User);
    expect(promptVariableGroup('user.language')).toBe(PromptVariableGroup.Language);
    expect(promptVariableGroup('message.text')).toBe(PromptVariableGroup.Message);
    expect(promptVariableGroup('channel')).toBe(PromptVariableGroup.Conversation);
    expect(promptVariableGroup('history')).toBe(PromptVariableGroup.Conversation);
    expect(promptVariableGroup('today')).toBe(PromptVariableGroup.System);
    expect(promptVariableGroup('event.order_id')).toBe(PromptVariableGroup.Event);
    expect(promptVariableGroup('user_id')).toBe(PromptVariableGroup.Caller);
    expect(promptVariableGroup('bookings.body')).toBe(PromptVariableGroup.Step);
  });
});

describe('promptVariableOptions', () => {
  it('offers the catalog and the paths the text adds, once each', () => {
    const options = promptVariableOptions(
      libraryVariables(),
      'Hi {{user.name}}, your booking is {{bookings.body}}.',
    );
    const paths = options.map((option) => option.path);

    expect(paths).toEqual([...new Set(paths)]);
    expect(paths).toContain('message.text');
    expect(paths).toContain('today');
    expect(paths.filter((path) => path === 'user.name')).toHaveLength(1);
    expect(options.at(-1)).toEqual({ path: 'bookings.body', group: PromptVariableGroup.Step });
  });
});
