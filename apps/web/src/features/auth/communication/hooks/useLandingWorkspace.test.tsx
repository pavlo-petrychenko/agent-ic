import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { buildMyWorkspacesMock } from '@/features/auth/communication/fixtures/auth.fixture';
import { useLandingWorkspace } from '@/features/auth/communication/hooks/useLandingWorkspace';

const wrapperFor =
  (mocks: readonly MockLink.MockedResponse[]) =>
  ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );

const resolveLanding = (mock: MockLink.MockedResponse): Promise<string | null> => {
  const { result } = renderHook(() => useLandingWorkspace(), { wrapper: wrapperFor([mock]) });
  return result.current();
};

describe('useLandingWorkspace', () => {
  it('resolves the workspace opened last', async () => {
    await expect(
      resolveLanding(buildMyWorkspacesMock(['ws_first', 'ws_last'], 'ws_last')),
    ).resolves.toBe('ws_last');
  });

  it('resolves the first workspace when the last one is not a membership any more', async () => {
    await expect(
      resolveLanding(buildMyWorkspacesMock(['ws_first', 'ws_second'], 'ws_gone')),
    ).resolves.toBe('ws_first');
  });

  it('resolves nothing for a user without workspaces', async () => {
    await expect(resolveLanding(buildMyWorkspacesMock([]))).resolves.toBeNull();
  });
});
