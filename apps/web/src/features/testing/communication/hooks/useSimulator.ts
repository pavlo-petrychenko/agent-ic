import { skipToken, useMutation, useQuery, useSubscription } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HandBackDocument } from '@/features/testing/communication/gql/mutation/handBack.generated';
import { ReplyAsOperatorDocument } from '@/features/testing/communication/gql/mutation/replyAsOperator.generated';
import { RestartSimulationDocument } from '@/features/testing/communication/gql/mutation/restartSimulation.generated';
import { SendSimulatorMessageDocument } from '@/features/testing/communication/gql/mutation/sendSimulatorMessage.generated';
import { StartSimulationDocument } from '@/features/testing/communication/gql/mutation/startSimulation.generated';
import { SimulationDocument } from '@/features/testing/communication/gql/query/simulation.generated';
import { ConversationActivityDocument } from '@/features/testing/communication/gql/subscription/conversationActivity.generated';
import { toSimulatorConversation } from '@/features/testing/communication/helpers/simulation.helpers';
import { SETUP_KEY_SEPARATOR } from '@/features/testing/constants/simulator.constants';
import type {
  SimulatorResult,
  SimulatorSetup,
} from '@/features/testing/typedefs/simulator.typedefs';

export function useSimulator(agentId: string | null, setup: SimulatorSetup): SimulatorResult {
  const { versionId, channelKind, language } = setup;
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ key: string; ok: boolean } | null>(null);
  const [startSimulation] = useMutation(StartSimulationDocument);
  const [restartSimulation, { loading: restarting }] = useMutation(RestartSimulationDocument);
  const [sendMessage, { loading: sending }] = useMutation(SendSimulatorMessageDocument);
  const [replyAsOperator, { loading: replying }] = useMutation(ReplyAsOperatorDocument);
  const [handBackConversation, { loading: handingBack }] = useMutation(HandBackDocument);
  const key =
    agentId === null
      ? null
      : [agentId, versionId, channelKind, language, attempt].join(SETUP_KEY_SEPARATOR);
  const started = key !== null && settled?.key === key && settled.ok;
  const { data, dataState, error, refetch } = useQuery(
    SimulationDocument,
    started && agentId !== null
      ? {
          variables: { agentId },
          fetchPolicy: 'network-only',
          notifyOnNetworkStatusChange: true,
          context: { queryDeduplication: false },
        }
      : skipToken,
  );
  const loadFailed = started && error !== undefined && dataState !== 'complete';
  const conversation = useMemo(
    () => (dataState === 'complete' ? toSimulatorConversation(data.simulation) : null),
    [data, dataState],
  );
  const conversationId = conversation?.conversationId ?? null;

  useSubscription(
    ConversationActivityDocument,
    conversationId === null
      ? skipToken
      : { variables: { conversationId }, onData: () => void refetch() },
  );

  useEffect(() => {
    if (agentId === null || key === null) {
      return;
    }
    let current = true;
    startSimulation({ variables: { input: { agentId, versionId, channelKind, language } } }).then(
      () => current && setSettled({ key, ok: true }),
      () => current && setSettled({ key, ok: false }),
    );
    return () => {
      current = false;
    };
  }, [agentId, key, versionId, channelKind, language, startSimulation]);

  const send = useCallback(
    async (text: string) => {
      if (conversationId !== null) {
        await sendMessage({ variables: { input: { conversationId, text } } });
        await refetch();
      }
    },
    [conversationId, refetch, sendMessage],
  );

  const reply = useCallback(
    async (text: string) => {
      if (conversationId !== null) {
        await replyAsOperator({ variables: { input: { conversationId, text } } });
        await refetch();
      }
    },
    [conversationId, refetch, replyAsOperator],
  );

  const handBack = useCallback(async () => {
    if (conversationId !== null) {
      await handBackConversation({ variables: { input: { conversationId } } });
      await refetch();
    }
  }, [conversationId, refetch, handBackConversation]);

  const restart = useCallback(async () => {
    if (agentId !== null) {
      await restartSimulation({ variables: { input: { agentId } } });
      await refetch();
    }
  }, [agentId, refetch, restartSimulation]);

  return {
    conversation,
    starting:
      key !== null &&
      (settled?.key !== key || (started && dataState !== 'complete' && !loadFailed)),
    failed: loadFailed || (key !== null && settled?.key === key && !settled.ok),
    loadFailed,
    sending,
    restarting,
    replying,
    handingBack,
    retry: () => (loadFailed ? void refetch() : setAttempt((value) => value + 1)),
    send,
    restart,
    reply,
    handBack,
  };
}
