import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  TRACE_RUN_ID,
  testingRunMock,
} from '@/features/testing/communication/fixtures/trace.fixture';
import { useTestingRun } from '@/features/testing/communication/hooks/useTestingRun';
import type { TestingRunResult } from '@/features/testing/typedefs/trace.typedefs';
import { RunStatus } from '@/shared/api/generated/schema.generated';

const renderRun = (mocks: readonly MockLink.MockedResponse[]) =>
  renderHook<TestingRunResult, { runId: string | null }>(
    ({ runId }) => useTestingRun(runId, RunStatus.Succeeded),
    {
      initialProps: { runId: TRACE_RUN_ID },
      wrapper: ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks}>{children}</MockedProvider>
      ),
    },
  );

describe('useTestingRun', () => {
  it('forgets the previous run once there is no run to show', async () => {
    const { result, rerender } = renderRun([testingRunMock(RunStatus.Succeeded, null)]);
    await waitFor(() => expect(result.current.run?.id).toBe(TRACE_RUN_ID));

    rerender({ runId: null });

    expect(result.current.run).toBeNull();
    expect(result.current.failed).toBe(false);
  });
});
