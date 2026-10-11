import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { ModelOptionsDocument } from '@/features/flow-builder/communication/gql/query/modelOptions.generated';
import { toModelChoices } from '@/features/flow-builder/communication/helpers/modelOption.helpers';
import type {
  ModelChoice,
  UseModelOptionsResult,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

const NO_MODELS: readonly ModelChoice[] = [];

export function useModelOptions(skip: boolean): UseModelOptionsResult {
  const { data, loading, error, refetch } = useQuery(ModelOptionsDocument, { skip });
  const models = useMemo(() => (data === undefined ? NO_MODELS : toModelChoices(data)), [data]);

  return {
    models,
    loading,
    error: error === undefined ? null : toAppError(error),
    retry: () => {
      refetch().catch(() => undefined);
    },
  };
}
