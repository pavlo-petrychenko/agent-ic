import type { PortName } from '@agent-ic/flow';
import type { SummaryKey } from '@/features/flow-builder/constants/nodeSummary.constants';

export interface SummaryPart {
  key: SummaryKey;
  params: Readonly<Record<string, string | number>>;
}

export type LabelledPort = PortName.Else | PortName.Error | PortName.Branches;

export type PortLabel = { rule: string } | { port: LabelledPort };
