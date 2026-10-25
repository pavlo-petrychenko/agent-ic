import type { InstrumentationBase } from '@opentelemetry/instrumentation';
import { register } from 'import-in-the-middle/register-hooks.mjs';

export const instrumentedModuleNames = (
  instrumentations: readonly InstrumentationBase[],
): string[] => [
  ...new Set(
    instrumentations.flatMap((instrumentation) =>
      instrumentation.getModuleDefinitions().map((definition) => definition.name),
    ),
  ),
];

export const registerInstrumentationHooks = (
  instrumentations: readonly InstrumentationBase[],
): void => {
  register({ include: instrumentedModuleNames(instrumentations) });
};
