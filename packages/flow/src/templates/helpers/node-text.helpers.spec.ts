import { describe, expect, it } from 'vitest';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import type { PromptSource } from '@flow/document/typedefs/flow.typedefs';
import { CompletionRole } from '@flow/nodes/constants/step.constants';
import {
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';
import { NodeTextKind } from '@flow/templates/constants/template.constants';
import { mapNodeText, nodeTextFields } from '@flow/templates/helpers/node-text.helpers';
import {
  agent,
  apiRequest,
  completion,
  escalation,
  rule,
  router,
  sendList,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

describe('nodeTextFields', () => {
  it('lists the URL, header values and body of an API request', () => {
    expect(nodeTextFields(apiRequest('load', 'https://x.test/{{event.id}}'))).toEqual([
      { kind: NodeTextKind.Template, path: ['url'], value: 'https://x.test/{{event.id}}' },
      { kind: NodeTextKind.Template, path: ['headers', '0', 'value'], value: '{{today}}' },
      { kind: NodeTextKind.Template, path: ['body', 'content'], value: '{}' },
    ]);
  });

  it('lists the variables of a router', () => {
    expect(
      nodeTextFields(
        router('route', [
          rule('first', 'guard.ok'),
          rule('second', 'guard.score', ConditionOperator.Gt, 3),
        ]),
      ),
    ).toEqual([
      {
        kind: NodeTextKind.Variable,
        path: ['rules', '0', 'conditions', '0', 'variable'],
        value: 'guard.ok',
      },
      {
        kind: NodeTextKind.Variable,
        path: ['rules', '1', 'conditions', '0', 'variable'],
        value: 'guard.score',
      },
    ]);
  });

  it('lists the content of a send message step', () => {
    expect(nodeTextFields(sendText('reply', 'Hi {{user.name}}'))).toEqual([
      { kind: NodeTextKind.Template, path: ['content', 'text'], value: 'Hi {{user.name}}' },
    ]);
    expect(nodeTextFields(sendList('reply', 'agent.messages'))).toEqual([
      { kind: NodeTextKind.Variable, path: ['content', 'variable'], value: 'agent.messages' },
      { kind: NodeTextKind.Variable, path: ['quickReplies', 'variable'], value: 'agent.messages' },
    ]);
  });

  it('lists the reason and fallback message of an escalation', () => {
    expect(
      nodeTextFields(escalation('handoff', '{{guard.reason}}', 'Later')).map((f) => f.path),
    ).toEqual([['reason'], ['fallbackMessage']]);
  });

  it('lists the inline prompt of an agent and a completion', () => {
    const prompt: PromptSource = {
      kind: PromptSourceKind.Inline,
      text: 'Reply to {{message.text}}',
    };
    expect(nodeTextFields(agent('answer', [], prompt))).toEqual([
      { kind: NodeTextKind.Template, path: ['prompt', 'text'], value: 'Reply to {{message.text}}' },
    ]);
    expect(nodeTextFields(completion('guard', CompletionRole.Guard))).toHaveLength(1);
  });

  it('lists nothing for a library prompt or no prompt', () => {
    const library: PromptSource = {
      kind: PromptSourceKind.Library,
      promptRef: 'prm_answer',
      pin: { kind: PromptVersionKind.Latest },
    };
    expect(nodeTextFields(agent('answer', [], library))).toEqual([]);
    expect(nodeTextFields(agent('answer', [], null))).toEqual([]);
  });
});

describe('mapNodeText', () => {
  it('rewrites every template and variable field', () => {
    const upper = {
      template: (text: string) => text.toUpperCase(),
      variable: (path: string) => `x.${path}`,
    };
    const mapped = [
      apiRequest('load', 'https://x.test'),
      sendList('reply', 'agent.messages'),
      escalation('handoff', 'why', 'later'),
      router('route', [rule('first', 'guard.ok')]),
      agent('answer'),
    ].flatMap((node) =>
      nodeTextFields(mapNodeText(node, upper)).map((textField) => textField.value),
    );
    expect(mapped).toEqual([
      'HTTPS://X.TEST',
      '{{TODAY}}',
      '{}',
      'x.agent.messages',
      'x.agent.messages',
      'WHY',
      'LATER',
      'x.guard.ok',
      'ANSWER AS ANSWER.',
    ]);
  });
});
