import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { TestPromptModelsDocument } from '@/features/prompts/communication/gql/query/testPromptModels.generated';
import { toPromptTestModelChoices } from '@/features/prompts/communication/helpers/promptTestModel.helpers';
import type {
  PromptTestModelChoice,
  UseTestPromptModelsResult,
} from '@/features/prompts/typedefs/promptTest.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

const NO_MODELS: readonly PromptTestModelChoice[] = [];

export function useTestPromptModels(skip: boolean): UseTestPromptModelsResult {
  const { data, loading, error, refetch } = useQuery(TestPromptModelsDocument, { skip });
  const models = useMemo(
    () => (data === undefined ? NO_MODELS : toPromptTestModelChoices(data)),
    [data],
  );

  return {
    models,
    loading,
    error: error === undefined ? null : toAppError(error),
    retry: () =>
      refetch()
        .then(() => undefined)
        .catch(() => undefined),
  };
}
