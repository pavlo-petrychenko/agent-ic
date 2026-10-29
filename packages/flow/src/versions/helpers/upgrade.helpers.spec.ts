import { describe, expect, it } from 'vitest';
import { NodeType, PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import { NO_AGENT_EXITS, WaitFor } from '@flow/nodes/constants/step.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';
import { hasBlockingIssues, validateFlow } from '@flow/validation/helpers/validation.helpers';
import { FlowV1WaitFor, SECOND_SCHEMA_VERSION } from '@flow/versions/constants/version.constants';
import { upgradeFlowV1, upgradeFlowV2 } from '@flow/versions/helpers/upgrade.helpers';
import type { FlowV1Document } from '@flow/versions/typedefs/version.typedefs';
import { exampleFlows, faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
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
import { toFlowV2 } from '@test/support/fixtures/flow-v2.fixture';

const OBSERVERS = { observerKeys: ['topic'] };

const upgradeToLatest = (flow: FlowV1Document): FlowDocument => upgradeFlowV2(upgradeFlowV1(flow));

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

const TAG_AND_SCORE = { observerKeys: ['tagger', 'scorer'], waitFor: FlowV1WaitFor.Guards };

const tagAndScoreFlow = (): FlowDocument => {
  const trigger = messageTrigger('incoming');
  const fork = parallel('fork', WaitFor.All);
  const tagger = completion('tagger');
  const scorer = completion('scorer');
  const reply = sendText('reply', 'hi');
  return flowOf(
    [trigger, fork, tagger, scorer, reply],
    [
      link(trigger, PortName.Next, fork),
      link(fork, PortName.Branches, tagger),
      link(fork, PortName.Branches, scorer),
      link(fork, PortName.Next, reply),
    ],
  );
};

describe('upgradeFlowV1', () => {
  it('gives a version 2 flow', () => {
    const v1 = toFlowV1(faqWithHandOffFlow, { ...OBSERVERS, waitFor: FlowV1WaitFor.Guards });
    expect(upgradeFlowV1(v1)).toEqual(toFlowV2(faqWithHandOffFlow));
    expect(upgradeFlowV1(v1).schemaVersion).toBe(SECOND_SCHEMA_VERSION);
  });

  it('turns the observer branch of the FAQ into a background branch', () => {
    const v1 = toFlowV1(faqWithHandOffFlow, { ...OBSERVERS, waitFor: FlowV1WaitFor.Guards });
    expect(upgradeToLatest(v1)).toEqual(faqWithHandOffFlow);
  });

  it.each([
    [FlowV1WaitFor.Guards, WaitFor.All],
    [FlowV1WaitFor.All, WaitFor.All],
    [FlowV1WaitFor.First, WaitFor.First],
  ])('maps wait for %s to %s', (before, after) => {
    const upgraded = upgradeToLatest(
      toFlowV1(faqWithHandOffFlow, { ...OBSERVERS, waitFor: before }),
    );
    expect(upgraded.nodes.find((node) => node.key === 'checks')?.config).toEqual({
      waitFor: after,
    });
  });

  it('keeps a branch waited when its observer comes after another step', () => {
    const upgraded = upgradeToLatest(toFlowV1(lookupThenTagFlow(), LOOKUP_THEN_TAG));
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
      upgradeToLatest(toFlowV1(flow, { ...LOOKUP_THEN_TAG, waitFor: FlowV1WaitFor.All })),
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
    const upgraded = upgradeToLatest(toFlowV1(flow, LOOKUP_THEN_TAG));
    expect(upgraded.edges.filter((edge) => edge.background === true)).toEqual([
      { ...innerToTagger, background: true },
    ]);
  });

  it('keeps the first branch waited when every branch starts with an observer', () => {
    const flow = tagAndScoreFlow();
    const upgraded = upgradeToLatest(toFlowV1(flow, TAG_AND_SCORE));
    expect(upgraded.edges.filter((edge) => edge.background === true)).toEqual([
      { ...flow.edges[2], background: true },
    ]);
  });

  it('accepts a version 1 parallel whose branches are all observers', () => {
    const issues = validateFlow(toFlowV1Json(tagAndScoreFlow(), TAG_AND_SCORE));
    expect(hasBlockingIssues(issues)).toBe(false);
  });
});

describe('upgradeFlowV2', () => {
  it.each(exampleFlows.map((flow, index) => [index, flow]))(
    'keeps example flow %i as it was, with exits and settings off',
    (_index, flow) => {
      expect(upgradeFlowV2(toFlowV2(flow))).toEqual(flow);
    },
  );

  it('turns every exit of every agent off and leaves every setting empty', () => {
    const upgraded = upgradeFlowV2(toFlowV2(faqWithHandOffFlow));
    const agents = upgraded.nodes.flatMap((node) => (node.type === NodeType.Agent ? [node] : []));

    expect(agents.map((node) => node.config.exits)).toEqual(agents.map(() => NO_AGENT_EXITS));
    expect(upgraded.settings).toEqual(NO_FLOW_SETTINGS);
  });
});
