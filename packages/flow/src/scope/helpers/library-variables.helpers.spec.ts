import { describe, expect, it } from 'vitest';
import {
  TODAY_VARIABLE,
  TRIGGER_VARIABLES,
  VariableType,
} from '@flow/scope/constants/scope.constants';
import { libraryVariables } from '@flow/scope/helpers/library-variables.helpers';

describe('libraryVariables', () => {
  it('lists every trigger variable of every trigger type, once', () => {
    const paths = libraryVariables().map((variable) => variable.path);

    expect(paths).toEqual([...new Set(paths)]);
    for (const variable of Object.values(TRIGGER_VARIABLES).flat()) {
      expect(paths).toContain(variable.path);
    }
  });

  it('adds today as a string', () => {
    const today = libraryVariables().find((variable) => variable.path === TODAY_VARIABLE);

    expect(today?.type).toBe(VariableType.String);
    expect(today?.open).toBe(false);
  });
});
