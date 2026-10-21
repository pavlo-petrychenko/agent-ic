import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { LlmKeyOptionsDocument } from '@/features/flow-builder/communication/gql/query/llmKeyOptions.generated';
import type {
  LlmKeyChoice,
  UseLlmKeyOptionsResult,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

const NO_KEYS: readonly LlmKeyChoice[] = [];

export function useLlmKeyOptions(skip: boolean): UseLlmKeyOptionsResult {
  const { data, loading, error } = useQuery(LlmKeyOptionsDocument, { skip });
  const keys = useMemo(
    () =>
      data === undefined
        ? NO_KEYS
        : data.llmKeyOptions.map(({ id, vendor, name }) => ({ id, vendor, name })),
    [data],
  );

  return { keys, loading, error: error === undefined ? null : toAppError(error) };
}
