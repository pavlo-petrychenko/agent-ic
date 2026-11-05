import type {
  ChannelType,
  FlowIssue,
  InactivityActivity,
  InactivityRepeatKind,
} from '@agent-ic/flow';
import type { ReactNode } from 'react';
import type { InactivityConfig } from '@/features/flow-builder/typedefs/inactivity.typedefs';
import type { FieldRow } from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface InactivityTriggerInspectorProps {
  config: InactivityConfig;
  silenceField: ReactNode;
  repeatEveryField: ReactNode;
  autoCloseIssue: FlowIssue | null;
  fields: readonly FieldRow[];
  onActivityChange: (activity: InactivityActivity) => void;
  onRepeatKindChange: (kind: InactivityRepeatKind) => void;
  onRepeatTimesChange: (times: number) => void;
  onNotEscalatedChange: (on: boolean) => void;
  onChannelChange: (type: ChannelType, on: boolean) => void;
}
