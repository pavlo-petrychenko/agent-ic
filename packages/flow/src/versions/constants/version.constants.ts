import { WaitFor } from '@flow/nodes/constants/step.constants';

export enum ParseFlowFailureKind {
  UnsupportedVersion = 'unsupported_version',
  InvalidDocument = 'invalid_document',
}

export const SCHEMA_VERSION_FIELD = 'schemaVersion';

export const FIRST_SCHEMA_VERSION = 1;

export enum FlowV1CompletionRole {
  Guard = 'guard',
  Observer = 'observer',
}

export enum FlowV1WaitFor {
  Guards = 'guards',
  All = 'all',
  First = 'first',
}

export const UPGRADED_WAIT_FOR: Readonly<Record<FlowV1WaitFor, WaitFor>> = {
  [FlowV1WaitFor.Guards]: WaitFor.All,
  [FlowV1WaitFor.All]: WaitFor.All,
  [FlowV1WaitFor.First]: WaitFor.First,
};
