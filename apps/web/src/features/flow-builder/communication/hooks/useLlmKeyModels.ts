import type { ObservableQuery } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LlmKeyModelsDocument,
  type LlmKeyModelsQuery,
  type LlmKeyModelsQueryVariables,
} from '@/features/flow-builder/communication/gql/query/llmKeyModels.generated';
import { toKeyModelChoices } from '@/features/flow-builder/communication/helpers/modelOption.helpers';
import { KEY_MODEL_PURPOSES } from '@/features/flow-builder/constants/llmStep.constants';
import type {
  KeyModels,
  KeyModelsState,
  LlmKeyChoice,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';

const PENDING: KeyModelsState = { ids: null, loading: true, failed: false };

export function useLlmKeyModels(keys: readonly LlmKeyChoice[]): readonly KeyModels[] {
  const client = useApolloClient();
  const queries = useRef(
    new Map<string, ObservableQuery<LlmKeyModelsQuery, LlmKeyModelsQueryVariables>>(),
  );
  const [states, setStates] = useState<ReadonlyMap<string, KeyModelsState>>(new Map());

  useEffect(() => {
    const watched = queries.current;
    const subscriptions = keys.map(({ id }) => {
      const query = client.watchQuery({ query: LlmKeyModelsDocument, variables: { keyId: id } });
      watched.set(id, query);
      return query.subscribe((result) =>
        setStates((current) =>
          new Map(current).set(id, {
            ids: result.data?.llmKeyModels ?? null,
            loading: result.loading,
            failed: result.error !== undefined,
          }),
        ),
      );
    });
    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      watched.clear();
    };
  }, [client, keys]);

  return useMemo(
    () =>
      keys.map((key) => {
        const state = states.get(key.id) ?? PENDING;
        return {
          key,
          choices: state.ids === null ? [] : toKeyModelChoices(key, state.ids, KEY_MODEL_PURPOSES),
          loading: state.loading,
          failed: state.failed,
          retry: () => {
            queries.current
              .get(key.id)
              ?.refetch()
              .catch(() => undefined);
          },
        };
      }),
    [keys, states],
  );
}
