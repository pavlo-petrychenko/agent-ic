import { describe, expect, it } from 'vitest';
import { PortName } from '@flow/document/constants/flow.constants';
import { RenameError } from '@flow/document/constants/rename.constants';
import { renameNodeKey } from '@flow/document/helpers/rename.helpers';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import { nodeTextFields } from '@flow/templates/helpers/node-text.helpers';
import { examplePrompt, faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
import {
  agent,
  escalation,
  flowOf,
  link,
  messageTrigger,
  rule,
  router,
  sendList,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

const texts = (flow: FlowDocument): string[] =>
  flow.nodes.flatMap((node) => nodeTextFields(node).map((textField) => textField.value));

describe('renameNodeKey', () => {
  const trigger = messageTrigger('incoming');
  const guard = agent('guard');
  const guardian = agent('guardian', [], examplePrompt('Check {{guard.reason}}'));
  const route = router('route', [rule('human', 'guard.needs_human')]);
  const reply = sendText('reply', 'Hi {{ guard.messages[0] }} {{guardian.messages}} {{guard}}');
  const list = sendList('list', ' guard.messages');
  const handoff = escalation('handoff', '{{guard.reason}}', '{{ guard }}');
  const flow = flowOf(
    [trigger, guard, guardian, route, reply, list, handoff],
    [
      link(trigger, PortName.Next, guard),
      link(guard, PortName.Next, guardian),
      link(guardian, PortName.Next, route),
      link(route, 'human', handoff),
      link(route, PortName.Else, reply),
      link(reply, PortName.Next, list),
    ],
  );

  it('renames the key and every reference to it, keeping spacing', () => {
    const renamed = renameNodeKey(flow, 'guard', 'gate');
    expect(renamed.nodes.map((node) => node.key)).toEqual([
      'incoming',
      'gate',
      'guardian',
      'route',
      'reply',
      'list',
      'handoff',
    ]);
    expect(texts(renamed)).toEqual([
      'Answer as guard.',
      'Check {{gate.reason}}',
      'gate.needs_human',
      'Hi {{ gate.messages[0] }} {{guardian.messages}} {{gate}}',
      ' gate.messages',
      ' gate.messages',
      '{{gate.reason}}',
      '{{ gate }}',
    ]);
  });

  it('keeps ids and edges', () => {
    const renamed = renameNodeKey(flow, 'guard', 'gate');
    expect(renamed.nodes.map((node) => node.id)).toEqual(flow.nodes.map((node) => node.id));
    expect(renamed.edges).toBe(flow.edges);
  });

  it('rewrites the example flow', () => {
    const renamed = renameNodeKey(faqWithHandOffFlow, 'guard', 'safety');
    expect(texts(renamed)).toContain('safety.needs_human');
    expect(texts(renamed)).toContain('{{safety.reason}}');
  });

  it('returns the same flow when the key does not change', () => {
    expect(renameNodeKey(flow, 'guard', 'guard')).toBe(flow);
  });

  it('refuses an unknown key, an invalid or reserved key and a taken key', () => {
    expect(() => renameNodeKey(flow, 'missing', 'x')).toThrow(RenameError.UnknownKey);
    expect(() => renameNodeKey(flow, 'guard', 'Gate')).toThrow(RenameError.InvalidKey);
    expect(() => renameNodeKey(flow, 'guard', 'message')).toThrow(RenameError.InvalidKey);
    expect(() => renameNodeKey(flow, 'guard', 'route')).toThrow(RenameError.KeyTaken);
  });
});
