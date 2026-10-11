import { Locale } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ANSWERS,
  QUESTION,
  TEST_CONVERSATION_ID,
  sendSimulatorMessageMock,
  simulationMock,
  startSimulationMock,
} from '@/features/testing/communication/fixtures/simulator.fixture';
import { TEST_AGENT_ID } from '@/features/testing/communication/fixtures/testing.fixture';
import { useSimulator } from '@/features/testing/communication/hooks/useSimulator';
import { ChannelKind } from '@/shared/api/generated/schema.generated';

const SETUP = { versionId: null, channelKind: ChannelKind.Simulated, language: Locale.En };

const renderSimulator = (agentId: string | null, mocks: readonly MockLink.MockedResponse[]) =>
  renderHook(() => useSimulator(agentId, SETUP), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    ),
  });

describe('useSimulator', () => {
  it('starts the simulation, then loads its conversation', async () => {
    const { result } = renderSimulator(TEST_AGENT_ID, [
      startSimulationMock(),
      simulationMock([QUESTION, ...ANSWERS]),
    ]);

    expect(result.current.starting).toBe(true);
    await waitFor(() => expect(result.current.conversation).not.toBeNull());

    expect(result.current.starting).toBe(false);
    expect(result.current.conversation?.conversationId).toBe(TEST_CONVERSATION_ID);
    expect(result.current.conversation?.messages).toHaveLength(3);
  });

  it('sends a message and refetches the conversation', async () => {
    const { result } = renderSimulator(TEST_AGENT_ID, [
      startSimulationMock(),
      simulationMock([], null),
      sendSimulatorMessageMock(QUESTION.text),
      simulationMock([QUESTION]),
    ]);
    await waitFor(() => expect(result.current.conversation).not.toBeNull());

    await act(() => result.current.send(QUESTION.text));

    await waitFor(() => expect(result.current.conversation?.messages).toHaveLength(1));
  });

  it('reports a failed start', async () => {
    const { result } = renderSimulator(TEST_AGENT_ID, [
      { ...startSimulationMock(), result: undefined, error: new Error('down') },
    ]);

    await waitFor(() => expect(result.current.failed).toBe(true));
  });

  it('stays idle without an agent', () => {
    const { result } = renderSimulator(null, []);

    expect(result.current.starting).toBe(false);
    expect(result.current.conversation).toBeNull();
  });
});
