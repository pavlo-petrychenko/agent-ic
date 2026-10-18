import {
  TODAY_VARIABLE,
  TRIGGER_VARIABLES,
  VariableType,
} from '@flow/scope/constants/scope.constants';
import type { TriggerVariable } from '@flow/scope/typedefs/scope.typedefs';

const TODAY: TriggerVariable = { path: TODAY_VARIABLE, type: VariableType.String, open: false };

export const libraryVariables = (): readonly TriggerVariable[] => {
  const tallies = new Map<string, TriggerVariable>();
  for (const variable of [...Object.values(TRIGGER_VARIABLES).flat(), TODAY]) {
    const existing = tallies.get(variable.path);
    if (existing === undefined) {
      tallies.set(variable.path, variable);
      continue;
    }
    if (existing.type !== variable.type) {
      tallies.set(variable.path, { path: variable.path, type: VariableType.Unknown, open: true });
    }
  }
  return [...tallies.values()];
};
