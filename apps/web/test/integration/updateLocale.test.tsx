import { Locale } from '@agent-ic/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUpdateMyLocaleMock } from '@/features/workspace/communication/fixtures/updateMyLocale.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const homePath = `/w/${DEMO_WORKSPACE.id}`;
const ACCOUNT_USER = {
  name: 'Pavlo',
  email: 'owner@demo-salon.example',
  locale: Locale.Uk,
};

describe('account language', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it("opens in the account's language", async () => {
    renderRoute(homePath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE], ACCOUNT_USER)],
    });

    const nav = within(await screen.findByRole('navigation', { name: 'Головна навігація' }));
    expect(await nav.findByRole('link', { name: 'Агенти' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Вхідні' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Налаштування' })).toBeInTheDocument();
  });

  it('saves the language on switch', async () => {
    const saveLocale = vi.fn<(locale: Locale) => void>();
    renderRoute(homePath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildUpdateMyLocaleMock(Locale.Uk, saveLocale),
      ],
    });

    await userEvent.click(await screen.findByRole('radio', { name: 'УКР' }));

    await waitFor(() => expect(saveLocale).toHaveBeenCalledWith(Locale.Uk));
  });
});
