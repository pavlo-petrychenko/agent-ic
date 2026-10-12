import { describe, expect, it } from 'vitest';
import { PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import { WaitFor } from '@flow/nodes/constants/step.constants';
import { hasBlockingIssues, validateFlow } from '@flow/validation/helpers/validation.helpers';
import { FlowV1WaitFor } from '@flow/versions/constants/version.constants';
import { upgradeFlowV1 } from '@flow/versions/helpers/upgrade.helpers';
import { faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
import {
  agent,
  apiRequest,
  completion,
  flowOf,
  link,
  messageTrigger,
  parallel,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';
import { toFlowV1, toFlowV1Json } from '@test/support/fixtures/flow-v1.fixture';

const OBSERVERS = { observerKeys: ['topic'] };

const LOOKUP_THEN_TAG = { observerKeys: ['tagger'], waitFor: FlowV1WaitFor.Guards };

const lookupThenTagFlow = (): FlowDocument => {
  const trigger = messageTrigger('incoming');
  const fork = parallel('fork', WaitFor.All);
  const writer = agent('writer');
  const lookup = apiRequest('lookup');
  const tagger = completion('tagger');
  const reply = sendText('reply', '{{lookup.body}}');
  return flowOf(
    [trigger, fork, writer, lookup, tagger, reply],
    [
      link(trigger, PortName.Next, fork),
      link(fork, PortName.Branches, writer),
      link(fork, PortName.Branches, lookup),
      link(lookup, PortName.Next, tagger),
      link(fork, PortName.Next, reply),
    ],
  );
};

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

  it('keeps a branch waited when its observer comes after another step', () => {
    const upgraded = upgradeFlowV1(toFlowV1(lookupThenTagFlow(), LOOKUP_THEN_TAG));
    expect(upgraded.edges.some((edge) => edge.background === true)).toBe(false);
  });

  it('accepts a reference to a step before the observer after the join', () => {
    const issues = validateFlow(toFlowV1Json(lookupThenTagFlow(), LOOKUP_THEN_TAG));
    expect(hasBlockingIssues(issues)).toBe(false);
  });

  it('upgrades an observer outside any parallel to a plain completion', () => {
    const trigger = messageTrigger('incoming');
    const tagger = completion('tagger');
    const reply = sendText('reply', 'hi');
    const flow = flowOf(
      [trigger, tagger, reply],
      [link(trigger, PortName.Next, tagger), link(tagger, PortName.Next, reply)],
    );
    expect(
      upgradeFlowV1(toFlowV1(flow, { ...LOOKUP_THEN_TAG, waitFor: FlowV1WaitFor.All })),
    ).toEqual(flow);
  });

  it('marks only the inner branch background when a nested branch starts with the observer', () => {
    const trigger = messageTrigger('incoming');
    const outer = parallel('outer', WaitFor.All);
    const inner = parallel('inner', WaitFor.All);
    const writer = agent('writer');
    const helper = agent('helper');
    const tagger = completion('tagger');
    const reply = sendText('reply', 'hi');
    const innerToTagger = link(inner, PortName.Branches, tagger);
    const flow = flowOf(
      [trigger, outer, inner, writer, helper, tagger, reply],
      [
        link(trigger, PortName.Next, outer),
        link(outer, PortName.Branches, writer),
        link(outer, PortName.Branches, inner),
        link(inner, PortName.Branches, helper),
        innerToTagger,
        link(outer, PortName.Next, reply),
      ],
    );
    const upgraded = upgradeFlowV1(toFlowV1(flow, LOOKUP_THEN_TAG));
    expect(upgraded.edges.filter((edge) => edge.background === true)).toEqual([
      { ...innerToTagger, background: true },
    ]);
  });
});
