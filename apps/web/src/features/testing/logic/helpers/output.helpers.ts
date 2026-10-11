import { NodeType } from '@agent-ic/flow';
import {
  DURATION_FRACTION_DIGITS,
  EMPTY_FIELD_VALUE,
  JSON_INDENT,
  MS_PER_SECOND,
  OutputViewKind,
  QUIET_OUTPUT_NODE_TYPES,
  RECIPIENT_LIST_FORMAT,
} from '@/features/testing/constants/trace.constants';
import type { OutputView, RunStepView } from '@/features/testing/typedefs/trace.typedefs';
import { RunStepStatus } from '@/shared/api/generated/schema.generated';

const isPlainValue = (value: unknown): value is string | number | boolean | null =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const recipientsOf = (output: Record<string, unknown>): string[] | null => {
  const { wouldNotify } = output;
  return Array.isArray(wouldNotify) &&
    wouldNotify.every((name): name is string => typeof name === 'string')
    ? wouldNotify
    : null;
};

export const toOutputView = (
  output: unknown,
  locale: string,
  nodeType: NodeType | null,
): OutputView | null => {
  if (output === null || (isRecord(output) && Object.keys(output).length === 0)) {
    return null;
  }
  const recipients =
    nodeType === NodeType.Escalation && isRecord(output) ? recipientsOf(output) : null;
  if (recipients !== null) {
    return {
      kind: OutputViewKind.Escalation,
      recipients:
        recipients.length === 0
          ? null
          : new Intl.ListFormat(locale, RECIPIENT_LIST_FORMAT).format(recipients),
    };
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

export const toStepView = (
  step: RunStepView,
  locale: string,
  nodeType: NodeType | null,
): OutputView | null => {
  if (step.status === RunStepStatus.Failed) {
    return { kind: OutputViewKind.Error, message: step.errorMessage };
  }
  return nodeType !== null && QUIET_OUTPUT_NODE_TYPES.has(nodeType)
    ? null
    : toOutputView(step.output, locale, nodeType);
};

export const formatSeconds = (durationMs: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: DURATION_FRACTION_DIGITS,
    maximumFractionDigits: DURATION_FRACTION_DIGITS,
  }).format(durationMs / MS_PER_SECOND);
