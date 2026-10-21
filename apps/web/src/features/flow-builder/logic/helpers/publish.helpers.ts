import type { FieldChange, FlowDocument } from '@agent-ic/flow';
import {
  ChangeKind,
  ChangeSentence,
  CONFIG_FIELD,
  DAY_HOURS,
  HOUR_MINUTES,
  LABEL_FIELD,
  LAYOUT_FIELDS,
  MAX_INLINE_VALUE_LENGTH,
  MINUTE_MS,
  PublishBlock,
} from '@/features/flow-builder/constants/publish.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { stepNameOf } from '@/features/flow-builder/logic/helpers/issue.helpers';
import type {
  ChangeLine,
  DiffEdge,
  DiffNode,
  PublishPreview,
} from '@/features/flow-builder/typedefs/publish.typedefs';

const inlineValue = (value: unknown): string | null => {
  if (typeof value === 'number') {
    return String(value);
  }
  return typeof value === 'string' && value.length <= MAX_INLINE_VALUE_LENGTH ? value : null;
};

const isEmpty = (value: unknown): boolean => value === null || value === '';

const fieldLine = (change: FieldChange): Pick<ChangeLine, 'sentence' | 'before' | 'after'> => {
  const { before, after } = change;
  const empty = { before: null, after: null };
  if (typeof after === 'boolean' && typeof before !== 'object') {
    return { sentence: after ? ChangeSentence.TurnedOn : ChangeSentence.TurnedOff, ...empty };
  }
  if (isEmpty(after)) {
    return { sentence: ChangeSentence.ValueCleared, ...empty };
  }
  const shownAfter = inlineValue(after);
  const shownBefore = inlineValue(before);
  if (isEmpty(before) && shownAfter !== null) {
    return { sentence: ChangeSentence.ValueSet, before: null, after: shownAfter };
  }
  if (shownBefore !== null && shownAfter !== null) {
    return { sentence: ChangeSentence.ValueChanged, before: shownBefore, after: shownAfter };
  }
  return { sentence: ChangeSentence.Edited, ...empty };
};

const fieldName = (path: readonly string[]): string =>
  (path[0] === CONFIG_FIELD ? path[1] : path[0]) ?? CONFIG_FIELD;

const promptBindingName = (path: readonly string[]): string | null =>
  path[0] === CONFIG_FIELD && path[1] === 'prompt' && path[2] === 'bindings'
    ? (path[3] ?? null)
    : null;

const promptBindingLine = (
  change: FieldChange,
): Pick<ChangeLine, 'sentence' | 'field' | 'variable' | 'before' | 'after'> | null => {
  const variable = promptBindingName(change.path);
  if (variable === null) {
    return null;
  }
  const before = inlineValue(change.before);
  const after = inlineValue(change.after);
  return {
    sentence:
      change.after === undefined || isEmpty(change.after)
        ? ChangeSentence.PromptBindingRemoved
        : change.before === undefined || isEmpty(change.before)
          ? ChangeSentence.PromptBindingSet
          : ChangeSentence.PromptBindingChanged,
    field: null,
    variable,
    before,
    after,
  };
};

export const toChangeLines = (
  diff: PublishPreview['diff'],
  document: FlowDocument,
): ChangeLine[] => {
  const names = new Map(
    [...document.nodes, ...diff.removedNodes].map((node) => [node.id, stepNameOf(node)]),
  );
  const stepName = (id: string, fallback: string) => names.get(id) ?? fallback;
  const touched = new Set([...diff.addedNodes, ...diff.removedNodes].map((node) => node.id));
  const relabeled = new Set(
    diff.changedNodes
      .filter((node) => node.fields.some((change) => change.path[0] === LABEL_FIELD))
      .map((node) => node.nodeId),
  );
  const edgeLines = (edges: readonly DiffEdge[], kind: ChangeKind, sentence: ChangeSentence) =>
    edges
      .filter((edge) => !touched.has(edge.source) && !touched.has(edge.target))
      .map((edge, index) => ({
        id: `${kind}-edge-${String(index)}`,
        kind,
        sentence,
        step: stepName(edge.source, edge.source),
        field: null,
        before: null,
        after: stepName(edge.target, edge.target),
      }));
  const stepLine = (node: DiffNode, kind: ChangeKind, sentence: ChangeSentence) => ({
    id: `${kind}-${node.id}`,
    kind,
    sentence,
    step: stepNameOf(node),
    field: null,
    before: null,
    after: null,
  });
  return [
    ...diff.addedNodes.map((node) => stepLine(node, ChangeKind.Added, ChangeSentence.StepAdded)),
    ...diff.renamedKeys
      .filter((rename) => !relabeled.has(rename.nodeId))
      .map((rename) => ({
        id: `rename-${rename.nodeId}`,
        kind: ChangeKind.Changed,
        sentence: ChangeSentence.StepRenamed,
        step: stepName(rename.nodeId, rename.to),
        field: null,
        before: rename.from,
        after: null,
      })),
    ...diff.changedNodes.flatMap((node) =>
      node.fields
        .filter((change) => !LAYOUT_FIELDS.includes(change.path[0] ?? ''))
        .map((change) => {
          const binding = promptBindingLine(change);
          return {
            id: `${node.nodeId}-${change.path.join('.')}`,
            kind: ChangeKind.Changed,
            step: stepName(node.nodeId, node.key),
            ...(binding ??
              (change.path[0] === LABEL_FIELD
                ? {
                    sentence: ChangeSentence.StepRenamed,
                    field: null,
                    before: inlineValue(change.before) ?? node.key,
                    after: null,
                  }
                : { field: fieldName(change.path), ...fieldLine(change) })),
          };
        }),
    ),
    ...diff.removedNodes.map((node) =>
      stepLine(node, ChangeKind.Removed, ChangeSentence.StepRemoved),
    ),
    ...edgeLines(diff.addedEdges, ChangeKind.Added, ChangeSentence.Connected),
    ...edgeLines(diff.removedEdges, ChangeKind.Removed, ChangeSentence.Disconnected),
    ...diff.changedEdges.map((edge, index) => ({
      id: `${ChangeKind.Changed}-edge-${String(index)}`,
      kind: ChangeKind.Changed,
      sentence: edge.background ? ChangeSentence.BranchInBackground : ChangeSentence.BranchWaited,
      step: stepName(edge.source, edge.source),
      field: null,
      before: null,
      after: stepName(edge.target, edge.target),
    })),
  ];
};

export const publishBlockOf = (
  saveState: SaveState,
  preview: PublishPreview,
  lines: readonly unknown[],
): PublishBlock | null => {
  if (saveState === SaveState.Conflict) {
    return PublishBlock.Conflict;
  }
  if (saveState === SaveState.Error) {
    return PublishBlock.SaveFailed;
  }
  if (saveState !== SaveState.Idle) {
    return PublishBlock.Unsaved;
  }
  if (preview.errorCount > 0) {
    return PublishBlock.Errors;
  }
  return preview.liveVersion !== null && lines.length === 0 ? PublishBlock.NoChanges : null;
};

export const formatTimeAgo = (iso: string, now: number, locale: string): string => {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.round((Date.parse(iso) - now) / MINUTE_MS);
  if (Math.abs(minutes) < HOUR_MINUTES) {
    return format.format(minutes, 'minute');
  }
  const hours = Math.round(minutes / HOUR_MINUTES);
  return Math.abs(hours) < DAY_HOURS
    ? format.format(hours, 'hour')
    : format.format(Math.round(hours / DAY_HOURS), 'day');
};
