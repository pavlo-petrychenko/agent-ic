import type { TestPromptModelsQuery } from '@/features/prompts/communication/gql/query/testPromptModels.generated';
import { PROMPT_TEST_CONVERSATION_PURPOSE } from '@/features/prompts/constants/promptTestSample.constants';
import type { PromptTestModelChoice } from '@/features/prompts/typedefs/promptTest.typedefs';

const PLATFORM_SOURCE = 'platform' as const;

export const toPromptTestModelChoices = (
  data: TestPromptModelsQuery,
): readonly PromptTestModelChoice[] =>
  data.modelOptions
    .filter((option) => option.source === PLATFORM_SOURCE)
    .map((option) => ({
      id: option.id,
      label: option.label,
      defaultFor: option.defaultFor,
    }));

export const defaultPromptTestModelId = (
  choices: readonly PromptTestModelChoice[],
): string | null => {
  const conversation = choices.find((choice) =>
    choice.defaultFor.includes(PROMPT_TEST_CONVERSATION_PURPOSE),
  );
  const first = conversation ?? choices[0];
  return first?.id ?? null;
};
