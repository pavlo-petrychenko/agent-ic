import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { ModelOptionsDocument } from '@/features/flow-builder/communication/gql/query/modelOptions.generated';
import { toModelChoices } from '@/features/flow-builder/communication/helpers/modelOption.helpers';
import type { ModelChoice } from '@/features/flow-builder/typedefs/llmStep.typedefs';

const NO_MODELS: readonly ModelChoice[] = [];

export function useModelOptions(skip: boolean): readonly ModelChoice[] {
  const { data } = useQuery(ModelOptionsDocument, { skip });
  return useMemo(() => (data === undefined ? NO_MODELS : toModelChoices(data)), [data]);
}
