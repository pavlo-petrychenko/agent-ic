import { describe, expect, it } from 'vitest';
import { PortName } from '@flow/document/constants/flow.constants';
import { WaitFor } from '@flow/nodes/constants/step.constants';
import { FlowV1WaitFor } from '@flow/versions/constants/version.constants';
import { upgradeFlowV1 } from '@flow/versions/helpers/upgrade.helpers';
import { faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
import {
  agent,
  completion,
  flowOf,
  link,
  messageTrigger,
  parallel,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';
import { toFlowV1 } from '@test/support/fixtures/flow-v1.fixture';

const OBSERVERS = { observerKeys: ['topic'] };

describe('upgradeFlowV1', () => {
  it('turns the observer branch of the FAQ into a background branch', () => {
    const v1 = toFlowV1(faqWithHandOffFlow, { ...OBSERVERS, waitFor: FlowV1WaitFor.Guards });
    expect(upgradeFlowV1(v1)).toEqual(faqWithHandOffFlow);
  });

  it.each([
    [FlowV1WaitFor.Guards, WaitFor.All],
    [FlowV1WaitFor.All, WaitFor.All],
    [FlowV1WaitFor.First, WaitFor.First],
  ])('maps wait for %s to %s', (before, after) => {
    const upgraded = upgradeFlowV1(toFlowV1(faqWithHandOffFlow, { ...OBSERVERS, waitFor: before }));
    expect(upgraded.nodes.find((node) => node.key === 'checks')?.config).toEqual({
      waitFor: after,
    });
  });

  it('marks a branch background when its observer comes after another step', () => {
    const trigger = messageTrigger('incoming');
    const fork = parallel('fork', WaitFor.All);
    const writer = agent('writer');
    const lookup = agent('lookup');
    const tagger = completion('tagger');
    const reply = sendText('reply', 'hi');
    const branchToLookup = link(fork, PortName.Branches, lookup);
    const flow = flowOf(
      [trigger, fork, writer, lookup, tagger, reply],
      [
        link(trigger, PortName.Next, fork),
        link(fork, PortName.Branches, writer),
        branchToLookup,
        link(lookup, PortName.Next, tagger),
        link(fork, PortName.Next, reply),
      ],
    );
    const upgraded = upgradeFlowV1(
      toFlowV1(flow, { observerKeys: ['tagger'], waitFor: FlowV1WaitFor.Guards }),
    );
    expect(upgraded.edges.filter((edge) => edge.background === true)).toEqual([
      { ...branchToLookup, background: true },
    ]);
  });
});
