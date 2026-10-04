import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  buildServerStatusFailureMock,
  buildServerStatusMock,
} from '@/features/status/communication/fixtures/serverStatus.fixture';
import { useServerStatus } from '@/features/status/communication/hooks/useServerStatus';
import { ClientErrorCode } from '@/shared/api/api.constants';

const wrapperFor =
  (mocks: readonly MockLink.MockedResponse[]) =>
  ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );

describe('useServerStatus', () => {
  it('maps the query result to the frontend status', async () => {
    const { result } = renderHook(() => useServerStatus(), {
      wrapper: wrapperFor([buildServerStatusMock('1.4.2', 93_784)]),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.status).toBeNull();

    await waitFor(() => expect(result.current.status).not.toBeNull());

    expect(result.current.status).toEqual({ version: '1.4.2', uptimeSeconds: 93_784 });
    expect(result.current.error).toBeNull();
  });

  it('reports a network failure as a typed AppError', async () => {
    const { result } = renderHook(() => useServerStatus(), {
      wrapper: wrapperFor([buildServerStatusFailureMock(new Error('offline'))]),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.status).toBeNull();
    expect(result.current.error?.code).toBe(ClientErrorCode.Network);
  });
});
