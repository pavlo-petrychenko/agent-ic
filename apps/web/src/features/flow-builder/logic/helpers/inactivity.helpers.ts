import {
  INACTIVITY_UNIT_MINUTES,
  InactivityRepeatKind,
  InactivityUnit,
  NodeType,
  durationMinutes,
} from '@agent-ic/flow';
import type {
  ChannelType,
  FlowDocument,
  InactivityActivity,
  InactivityDuration,
} from '@agent-ic/flow';
import {
  INACTIVITY_DEFAULT_REPEAT_TIMES,
  INACTIVITY_UNITS_LARGEST_FIRST,
} from '@/features/flow-builder/constants/inactivity.constants';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type { InactivityConfig } from '@/features/flow-builder/typedefs/inactivity.typedefs';

export const updateInactivity = (
  document: FlowDocument,
  nodeId: string,
  update: (config: InactivityConfig) => InactivityConfig,
): FlowDocument =>
  updateNode(document, nodeId, (node) =>
    node.type === NodeType.TriggerInactivity ? { ...node, config: update(node.config) } : node,
  );

export const toInactivityDuration = (minutes: number): InactivityDuration => {
  const unit =
    INACTIVITY_UNITS_LARGEST_FIRST.find(
      (candidate) => minutes % INACTIVITY_UNIT_MINUTES[candidate] === 0,
    ) ?? InactivityUnit.Minutes;
  return { amount: minutes / INACTIVITY_UNIT_MINUTES[unit], unit };
};

export const withSilence = (config: InactivityConfig, minutes: number): InactivityConfig => ({
  ...config,
  silence: toInactivityDuration(minutes),
});

export const withActivity = (
  config: InactivityConfig,
  activity: InactivityActivity,
): InactivityConfig => ({ ...config, activity });

export const withRepeatKind = (
  config: InactivityConfig,
  kind: InactivityRepeatKind,
): InactivityConfig => {
  if (config.repeat.kind === kind) {
    return config;
  }
  return {
    ...config,
    repeat:
      kind === InactivityRepeatKind.Once
        ? { kind }
        : {
            kind,
            every: toInactivityDuration(durationMinutes(config.silence)),
            maxTimes: INACTIVITY_DEFAULT_REPEAT_TIMES,
          },
  };
};

export const withRepeatEvery = (config: InactivityConfig, minutes: number): InactivityConfig =>
  config.repeat.kind === InactivityRepeatKind.Every
    ? { ...config, repeat: { ...config.repeat, every: toInactivityDuration(minutes) } }
    : config;

export const withRepeatTimes = (config: InactivityConfig, maxTimes: number): InactivityConfig =>
  config.repeat.kind === InactivityRepeatKind.Every
    ? { ...config, repeat: { ...config.repeat, maxTimes } }
    : config;

export const withNotEscalated = (
  config: InactivityConfig,
  notEscalated: boolean,
): InactivityConfig => ({ ...config, conditions: { ...config.conditions, notEscalated } });

export const withChannelType = (
  config: InactivityConfig,
  type: ChannelType,
  on: boolean,
): InactivityConfig => ({
  ...config,
  conditions: {
    ...config.conditions,
    channelTypes: [
      ...config.conditions.channelTypes.filter((existing) => existing !== type),
      ...(on ? [type] : []),
    ],
  },
});
