import type { ChannelType, FlowIssue, ScheduleKind } from '@agent-ic/flow';
import type { ReactNode } from 'react';
import type { FieldRow } from '@/features/flow-builder/typedefs/inspector.typedefs';
import type { ScheduleConfig } from '@/features/flow-builder/typedefs/schedule.typedefs';

export interface ScheduleTriggerInspectorProps {
  config: ScheduleConfig;
  nextRuns: readonly string[];
  fields: readonly FieldRow[];
  issue: (path: string) => FlowIssue | null;
  onKindChange: (kind: ScheduleKind) => void;
  onTimeChange: (time: string) => void;
  onCronChange: (cron: string) => void;
  onCommit: () => void;
  timeZoneField: ReactNode;
  silenceField: ReactNode;
  onSilentToggle: (on: boolean) => void;
  onNotEscalatedChange: (on: boolean) => void;
  onChannelChange: (type: ChannelType, on: boolean) => void;
  onMaxChange: (max: number) => void;
  onOncePerConversationChange: (on: boolean) => void;
}
