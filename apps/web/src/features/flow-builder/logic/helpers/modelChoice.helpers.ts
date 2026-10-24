import { ModelProviderKind } from '@agent-ic/flow';
import type { ModelRef } from '@agent-ic/flow';
import {
  CHOICE_KEY_SEPARATOR,
  PLATFORM_CHOICE_SOURCE,
} from '@/features/flow-builder/constants/llmStep.constants';
import type {
  ModelChoiceKey,
  ModelGroup,
  ModelOption,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';

export const choiceSource = (providerKeyId: string | null): string =>
  providerKeyId ?? PLATFORM_CHOICE_SOURCE;

export const groupChoiceKey = (groupId: string, model: string): string =>
  `${groupId}${CHOICE_KEY_SEPARATOR}${model}`;

export const choiceKey = ({ providerKeyId, model }: ModelChoiceKey): string =>
  groupChoiceKey(choiceSource(providerKeyId), model);

export const parseChoiceKey = (key: string): ModelChoiceKey | null => {
  const at = key.indexOf(CHOICE_KEY_SEPARATOR);
  if (at <= 0 || at === key.length - 1) {
    return null;
  }
  const source = key.slice(0, at);
  return {
    providerKeyId: source === PLATFORM_CHOICE_SOURCE ? null : source,
    model: key.slice(at + CHOICE_KEY_SEPARATOR.length),
  };
};

export const refChoiceKey = (ref: ModelRef): ModelChoiceKey => ({
  providerKeyId:
    ref.provider.kind === ModelProviderKind.Workspace ? ref.provider.providerKeyId : null,
  model: ref.model,
});

export const modelRefOf = ({ providerKeyId, model }: ModelChoiceKey): ModelRef =>
  providerKeyId === null
    ? { provider: { kind: ModelProviderKind.Platform }, model }
    : { provider: { kind: ModelProviderKind.Workspace, providerKeyId }, model };

export const modelOptions = (
  groups: readonly ModelGroup[],
  model: ModelRef | null,
): readonly ModelOption[] => {
  const listed = groups.flatMap((group) =>
    group.choices.map((choice) => ({
      key: groupChoiceKey(group.id, choice.id),
      model: choice.id,
      group: group.id,
      choice,
    })),
  );
  if (model === null) {
    return listed;
  }
  const current = refChoiceKey(model);
  const key = choiceKey(current);
  if (listed.some((option) => option.key === key)) {
    return listed;
  }
  const source = choiceSource(current.providerKeyId);
  const group = groups.some((candidate) => candidate.id === source) ? source : null;
  return [...listed, { key, model: model.model, group, choice: null }];
};
