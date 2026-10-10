import { PortName } from '@agent-ic/flow';
import type { LabelledPort } from '@/features/flow-builder/typedefs/nodeSummary.typedefs';

export enum SummaryKey {
  AllChannels = 'allChannels',
  SomeChannels = 'someChannels',
  Model = 'model',
  NoModel = 'noModel',
  InlinePrompt = 'inlinePrompt',
  LibraryPrompt = 'libraryPrompt',
  Outputs = 'outputs',
  EachItem = 'eachItem',
  Text = 'text',
  Request = 'request',
  NotifyTeam = 'notifyTeam',
  EndChat = 'endChat',
}

export const OUTPUT_FIELDS_SEPARATOR = ', ';
export const SUMMARY_SEPARATOR = ' · ';

export const LABELLED_PORTS: readonly LabelledPort[] = [
  PortName.Else,
  PortName.Error,
  PortName.Branches,
];
