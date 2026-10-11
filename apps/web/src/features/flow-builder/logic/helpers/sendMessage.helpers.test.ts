import { VariableSourceKind, VariableType } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  listVariables,
  replaceButton,
} from '@/features/flow-builder/logic/helpers/sendMessage.helpers';

const variable = (path: string, type: VariableType) => ({
  path,
  type,
  open: false,
  nullable: false,
  values: null,
  source: VariableSourceKind.Step,
  nodeId: null,
});

describe('send message helpers', () => {
  it('offers only lists and open values as message lists', () => {
    const variables = [
      variable('agent.messages', VariableType.StringList),
      variable('api.body', VariableType.Unknown),
      variable('message.text', VariableType.String),
    ];

    expect(listVariables(variables)).toEqual(['agent.messages', 'api.body']);
  });

  it('replaces, appends and removes a button', () => {
    expect(replaceButton(['a', 'b'], 1, 'c')).toEqual(['a', 'c']);
    expect(replaceButton(['a'], 1, 'b')).toEqual(['a', 'b']);
    expect(replaceButton(['a', 'b'], 0, null)).toEqual(['b']);
  });
});
