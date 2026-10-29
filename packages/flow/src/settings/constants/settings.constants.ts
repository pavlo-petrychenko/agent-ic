import type { FlowSettings } from '@flow/document/typedefs/flow.typedefs';

export enum UnhandledFailureAction {
  Handoff = 'handoff',
}

export const NO_FLOW_SETTINGS: FlowSettings = {
  handoff: null,
  onUnhandledFailure: null,
  autoClose: null,
};
