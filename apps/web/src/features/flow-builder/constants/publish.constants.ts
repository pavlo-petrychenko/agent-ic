export enum ChangeKind {
  Added = 'added',
  Changed = 'changed',
  Removed = 'removed',
}

export enum ChangeSentence {
  StepAdded = 'stepAdded',
  StepRemoved = 'stepRemoved',
  StepRenamed = 'stepRenamed',
  ValueChanged = 'valueChanged',
  ValueSet = 'valueSet',
  ValueCleared = 'valueCleared',
  TurnedOn = 'turnedOn',
  TurnedOff = 'turnedOff',
  Edited = 'edited',
  Connected = 'connected',
  Disconnected = 'disconnected',
}

export enum PublishBlock {
  Conflict = 'conflict',
  Unsaved = 'unsaved',
  Errors = 'errors',
  NoChanges = 'noChanges',
}

export enum CheckTone {
  Ok = 'ok',
  Warn = 'warn',
  Err = 'err',
}

export const CONFIG_FIELD = 'config';
export const LABEL_FIELD = 'label';
export const LAYOUT_FIELDS: readonly string[] = ['position'];
export const MAX_INLINE_VALUE_LENGTH = 40;
export const VERSIONS_PATH = '/w/$workspaceId/testing/versions';
export const MINUTE_MS = 60_000;
export const HOUR_MINUTES = 60;
export const DAY_HOURS = 24;
