import {
  ChannelType,
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
  NodeType,
} from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  toInactivityDuration,
  updateInactivity,
  withActivity,
  withChannelType,
  withNotEscalated,
  withRepeatEvery,
  withRepeatKind,
  withRepeatTimes,
  withSilence,
} from '@/features/flow-builder/logic/helpers/inactivity.helpers';

const TEMPLATE = NODE_TEMPLATES[NodeType.TriggerInactivity].config;
const EVERY = withRepeatKind(TEMPLATE, InactivityRepeatKind.Every);

describe('new inactivity trigger', () => {
  it('waits 2 h for any message, fires once, skips escalated chats and uses every channel', () => {
    const [node] = addNode(EMPTY_FLOW, NodeType.TriggerInactivity, { x: 0, y: 0 }, 'q').nodes;

    expect(node).toMatchObject({
      type: NodeType.TriggerInactivity,
      config: {
        silence: { amount: 2, unit: InactivityUnit.Hours },
        activity: InactivityActivity.Any,
        repeat: { kind: InactivityRepeatKind.Once },
        conditions: {
          notEscalated: true,
          channelTypes: [ChannelType.Telegram, ChannelType.Api],
        },
      },
    });
  });

  it('does not share its lists with the template', () => {
    const [node] = addNode(EMPTY_FLOW, NodeType.TriggerInactivity, { x: 0, y: 0 }, 'q').nodes;

    expect(
      node?.type === NodeType.TriggerInactivity && node.config.conditions.channelTypes,
    ).not.toBe(TEMPLATE.conditions.channelTypes);
  });
});

describe('toInactivityDuration', () => {
  it('uses the largest unit that divides the minutes', () => {
    expect(toInactivityDuration(30)).toEqual({ amount: 30, unit: InactivityUnit.Minutes });
    expect(toInactivityDuration(120)).toEqual({ amount: 2, unit: InactivityUnit.Hours });
    expect(toInactivityDuration(2880)).toEqual({ amount: 2, unit: InactivityUnit.Days });
    expect(toInactivityDuration(90)).toEqual({ amount: 90, unit: InactivityUnit.Minutes });
  });
});

describe('inactivity config changes', () => {
  it('sets the silence from minutes', () => {
    expect(withSilence(TEMPLATE, 1440).silence).toEqual({ amount: 1, unit: InactivityUnit.Days });
  });

  it('sets the activity and the escalation condition', () => {
    expect(withActivity(TEMPLATE, InactivityActivity.Customer).activity).toBe(
      InactivityActivity.Customer,
    );
    expect(withNotEscalated(TEMPLATE, false).conditions.notEscalated).toBe(false);
  });

  it('repeats every silence length up to three times, then goes back to once', () => {
    expect(EVERY.repeat).toEqual({
      kind: InactivityRepeatKind.Every,
      every: { amount: 2, unit: InactivityUnit.Hours },
      maxTimes: 3,
    });
    expect(withRepeatKind(EVERY, InactivityRepeatKind.Every)).toBe(EVERY);
    expect(withRepeatKind(EVERY, InactivityRepeatKind.Once).repeat).toEqual({
      kind: InactivityRepeatKind.Once,
    });
  });

  it('changes the repeat only while repeating', () => {
    expect(withRepeatEvery(EVERY, 300).repeat).toMatchObject({
      every: { amount: 5, unit: InactivityUnit.Hours },
    });
    expect(withRepeatTimes(EVERY, 5).repeat).toMatchObject({ maxTimes: 5 });
    expect(withRepeatEvery(TEMPLATE, 300)).toBe(TEMPLATE);
    expect(withRepeatTimes(TEMPLATE, 5)).toBe(TEMPLATE);
  });

  it('adds and removes a channel type once', () => {
    const api = withChannelType(TEMPLATE, ChannelType.Telegram, false);

    expect(api.conditions.channelTypes).toEqual([ChannelType.Api]);
    expect(withChannelType(api, ChannelType.Telegram, true).conditions.channelTypes).toEqual([
      ChannelType.Api,
      ChannelType.Telegram,
    ]);
    expect(withChannelType(api, ChannelType.Api, true).conditions.channelTypes).toEqual([
      ChannelType.Api,
    ]);
  });
});

describe('updateInactivity', () => {
  it('changes only the inactivity trigger it is asked for', () => {
    const added = addNode(EMPTY_FLOW, NodeType.TriggerInactivity, { x: 0, y: 0 }, 'q');
    const changed = updateInactivity(added, 'q', (config) => withNotEscalated(config, false));

    expect(changed.nodes[0]).toMatchObject({ config: { conditions: { notEscalated: false } } });
    expect(updateInactivity(added, 'other', (config) => withNotEscalated(config, false))).toEqual(
      added,
    );
  });
});
