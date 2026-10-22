import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { TestPromptDocument } from '@/features/prompts/communication/gql/mutation/testPrompt.generated';
import type { UseTestPromptResult } from '@/features/prompts/typedefs/promptTest.typedefs';
import type { TestPromptInput } from '@/shared/api/generated/schema.generated';

export function useTestPrompt(): UseTestPromptResult {
  const [test, { data, loading, error }] = useMutation(TestPromptDocument);

  const run = useCallback(
    (input: TestPromptInput) => {
      void test({ variables: { input } });
    },
    [test],
  );

  return {
    run,
    running: loading,
    failed: error !== undefined,
    data: data?.testPrompt ?? null,
  };
}
