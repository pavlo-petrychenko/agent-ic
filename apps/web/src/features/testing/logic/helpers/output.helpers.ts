import {
  AGENT_MESSAGES_FIELD_NAME,
  AGENT_OUTCOME_REASON_FIELD_NAME,
  AgentExitKind,
  EscalationMode,
  NodeType,
  RecipientsKind,
} from '@agent-ic/flow';
import type { AgentNode, EscalationNode, FlowDocument, HandoffSettings } from '@agent-ic/flow';
import {
  DURATION_FRACTION_DIGITS,
  EMPTY_FIELD_VALUE,
  EXIT_MESSAGE_SEPARATOR,
  ExitPath,
  JSON_INDENT,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  MS_PER_SECOND,
  OutputViewKind,
  QUIET_OUTPUT_NODE_TYPES,
  RECIPIENT_LIST_FORMAT,
  StepSection,
} from '@/features/testing/constants/trace.constants';
import { agentOutcome, exitEdge, isRecord } from '@/features/testing/logic/helpers/exit.helpers';
import type {
  ExitRecipients,
  OutputView,
  RunStepView,
  StepContext,
  StepSectionView,
} from '@/features/testing/typedefs/trace.typedefs';
import { RunStepStatus } from '@/shared/api/generated/schema.generated';

const NO_STEP_CONTEXT: StepContext = { node: null, flow: null, texts: [] };

const isPlainValue = (value: unknown): value is string | number | boolean | null =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

const stringsOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const messageOf = (texts: readonly string[]): string | null =>
  texts.length === 0 ? null : texts.join(EXIT_MESSAGE_SEPARATOR);

const toExitRecipients = (recipients: HandoffSettings['notify']['recipients']): ExitRecipients =>
  recipients.kind === RecipientsKind.Users
    ? { kind: RecipientsKind.Users, count: recipients.userIds.length }
    : recipients;

const escalationView = (
  output: Record<string, unknown>,
  node: EscalationNode,
  texts: readonly string[],
  locale: string,
): OutputView => {
  const { config } = node;
  const wouldNotify = stringsOf(output.wouldNotify);
  return {
    kind: OutputViewKind.Escalation,
    mode: config.mode,
    reason: textOf(output.reason),
    recipients:
      config.mode === EscalationMode.Escalate ? toExitRecipients(config.notify.recipients) : null,
    wouldNotify:
      wouldNotify.length === 0
        ? null
        : new Intl.ListFormat(locale, RECIPIENT_LIST_FORMAT).format(wouldNotify),
    message: messageOf(texts),
    resumed: false,
  };
};

const agentExitView = (
  output: Record<string, unknown>,
  node: AgentNode,
  flow: FlowDocument | null,
): OutputView | null => {
  const outcome = agentOutcome(output);
  if (outcome === null) {
    return null;
  }
  const edge = exitEdge(flow, node.id, outcome);
  const handoff = flow?.settings.handoff ?? null;
  const fallsBack = edge === null && outcome === AgentExitKind.Handoff && handoff !== null;
  return {
    kind: OutputViewKind.AgentExit,
    outcome,
    reason: textOf(output[AGENT_OUTCOME_REASON_FIELD_NAME]),
    path: edge === null ? ExitPath.Default : ExitPath.Connected,
    next:
      edge === null
        ? null
        : (flow?.nodes.find((target) => target.id === edge.target)?.label ?? edge.target),
    recipients: fallsBack ? toExitRecipients(handoff.notify.recipients) : null,
    message: edge === null ? messageOf(stringsOf(output[AGENT_MESSAGES_FIELD_NAME])) : null,
  };
};

const exitView = (
  output: Record<string, unknown>,
  { node, flow, texts }: StepContext,
  locale: string,
): OutputView | null => {
  if (node?.type === NodeType.Escalation) {
    return escalationView(output, node, texts, locale);
  }
  return node?.type === NodeType.Agent ? agentExitView(output, node, flow) : null;
};

export const toOutputView = (
  output: unknown,
  locale: string,
  context: StepContext,
): OutputView | null => {
  if (output === null || (isRecord(output) && Object.keys(output).length === 0)) {
    return null;
  }
  const exit = isRecord(output) ? exitView(output, context, locale) : null;
  if (exit !== null) {
    return exit;
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

export const withHandBack = (view: OutputView, handedBack: boolean): OutputView =>
  view.kind === OutputViewKind.Escalation && handedBack ? { ...view, resumed: true } : view;

export const toStepView = (
  step: RunStepView,
  locale: string,
  context: StepContext,
): OutputView | null => {
  if (step.status === RunStepStatus.Failed) {
    return { kind: OutputViewKind.Error, message: step.errorMessage };
  }
  const nodeType = context.node?.type ?? null;
  return nodeType !== null && QUIET_OUTPUT_NODE_TYPES.has(nodeType)
    ? null
    : toOutputView(step.output, locale, context);
};

export const inspectStep = (
  step: RunStepView,
  locale: string,
  context: StepContext,
): StepSectionView[] => {
  const failed = step.status === RunStepStatus.Failed;
  const views = {
    [StepSection.Input]: toOutputView(step.input, locale, NO_STEP_CONTEXT),
    [StepSection.Output]: failed ? null : toOutputView(step.output, locale, context),
    [StepSection.Error]: failed ? { kind: OutputViewKind.Error, message: step.errorMessage } : null,
  } satisfies Record<StepSection, OutputView | null>;
  return Object.values(StepSection).flatMap((section) => {
    const view = views[section];
    return view === null ? [] : [{ section, view }];
  });
};

export const formatMinutes = (minutes: number, locale: string): string => {
  const [value, unit] =
    minutes % MINUTES_PER_DAY === 0
      ? [minutes / MINUTES_PER_DAY, 'day']
      : minutes % MINUTES_PER_HOUR === 0
        ? [minutes / MINUTES_PER_HOUR, 'hour']
        : [minutes, 'minute'];
  return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
};

export const autoCloseView = (flow: FlowDocument | null, locale: string): OutputView => {
  const afterMinutes = flow?.settings.autoClose?.afterMinutes ?? null;
  return {
    kind: OutputViewKind.AutoClose,
    after: afterMinutes === null ? null : formatMinutes(afterMinutes, locale),
  };
};

export const formatSeconds = (durationMs: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: DURATION_FRACTION_DIGITS,
    maximumFractionDigits: DURATION_FRACTION_DIGITS,
  }).format(durationMs / MS_PER_SECOND);
