import type { NodeType } from '@agent-ic/flow';
import {
  DURATION_FRACTION_DIGITS,
  EMPTY_FIELD_VALUE,
  JSON_INDENT,
  MS_PER_SECOND,
  OutputViewKind,
  QUIET_OUTPUT_NODE_TYPES,
} from '@/features/testing/constants/trace.constants';
import type { OutputView, RunStepView } from '@/features/testing/typedefs/trace.typedefs';

const isPlainValue = (value: unknown): value is string | number | boolean | null =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toOutputView = (output: unknown): OutputView | null => {
  if (output === null || (isRecord(output) && Object.keys(output).length === 0)) {
    return null;
  }
  if (isRecord(output) && Object.values(output).every(isPlainValue)) {
    return {
      kind: OutputViewKind.Fields,
      fields: Object.entries(output).map(([label, value]) => ({
        label,
        value:
          isPlainValue(value) && value !== null && value !== '' ? String(value) : EMPTY_FIELD_VALUE,
      })),
    };
  }
  return { kind: OutputViewKind.Json, code: JSON.stringify(output, null, JSON_INDENT) };
};

export const toStepView = (step: RunStepView, nodeType: NodeType | null): OutputView | null =>
  nodeType !== null && QUIET_OUTPUT_NODE_TYPES.has(nodeType) ? null : toOutputView(step.output);

export const formatSeconds = (durationMs: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: DURATION_FRACTION_DIGITS,
    maximumFractionDigits: DURATION_FRACTION_DIGITS,
  }).format(durationMs / MS_PER_SECOND);
