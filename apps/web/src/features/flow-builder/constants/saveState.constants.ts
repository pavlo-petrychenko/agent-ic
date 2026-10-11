export enum SaveState {
  Idle = 'idle',
  Pending = 'pending',
  Saving = 'saving',
  Conflict = 'conflict',
  Error = 'error',
}

export const UNSAVED_STATES = new Set([SaveState.Pending, SaveState.Saving, SaveState.Error]);
