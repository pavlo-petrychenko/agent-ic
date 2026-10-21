import { ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildLlmCatalogMock } from '@/features/settings/communication/fixtures/llmCatalog.fixture';
import {
  ANTHROPIC_KEY,
  CHECKED_MODELS,
  CUSTOM_KEY,
  VALID_API_KEY,
  buildAddLlmKeyMock,
  buildCheckLlmKeyMock,
  buildFailedCheckLlmKeyMock,
  buildFailedLlmKeysMock,
  buildLlmKeysMock,
  buildRemoveLlmKeyMock,
  buildSetLlmKeyFallbackMock,
} from '@/features/settings/communication/fixtures/llmKeys.fixture';
import { LLM_KEY_CHECK_DEBOUNCE_MS } from '@/features/settings/constants/llmKey.constants';
import { LlmKeysPage } from '@/features/settings/containers/LlmKeysPage/LlmKeysPage';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const WORKSPACE_ID = 'ws_demo';

vi.mock('@/features/workspace', async () => {
  const { WorkspaceRole } = await import('@agent-ic/contracts');
  return {
    useActiveWorkspace: () => ({
      id: 'ws_demo',
      name: 'Demo salon',
      timeZone: 'Europe/Kyiv',
      memberCount: 1,
      role: WorkspaceRole.Owner,
      permissions: {},
    }),
  };
});

const CHECK_TIMEOUT_MS = LLM_KEY_CHECK_DEBOUNCE_MS * 5;
const OPENAI_KEY = {
  ...ANTHROPIC_KEY,
  id: 'llk_openai',
  vendor: LlmKeyVendor.Openai,
  name: 'OpenAI',
  keyLast4: '5678',
  usedBySteps: 0,
};

const renderPage = (mocks: readonly MockLink.MockedResponse[]) =>
  renderWithProviders(
    <MemoryRouter>
      <LlmKeysPage workspaceId={WORKSPACE_ID} />
    </MemoryRouter>,
    { mocks: [buildLlmCatalogMock(), ...mocks] },
  );

const rowOf = (title: string): HTMLElement => {
  const row = screen
    .getAllByRole('listitem')
    .find((item) => within(item).queryByText(title) !== null);
  if (row === undefined) {
    throw new Error(`No row titled ${title}`);
  }
  return row;
};

const typeKey = async (user: ReturnType<typeof userEvent.setup>) => {
  const input = await screen.findByLabelText('API key');
  await user.type(input, VALID_API_KEY);
};

describe('LlmKeysPage', () => {
  it('lists the platform row, the vendors and the custom endpoints', async () => {
    renderPage([buildLlmKeysMock([ANTHROPIC_KEY, CUSTOM_KEY])]);

    const anthropic = await waitFor(() => rowOf('Anthropic'));
    expect(
      within(anthropic).getByText('Key ends …41aa · added by Pavlo · used by 2 steps'),
    ).toBeInTheDocument();
    expect(within(anthropic).getByText('Connected')).toBeInTheDocument();
    expect(within(rowOf('OpenAI')).getByRole('button', { name: 'Add key' })).toBeInTheDocument();
    expect(
      within(rowOf('Company gateway')).getByText(/^llm\.example\.com · Key ends …9f3c/),
    ).toBeInTheDocument();
    expect(within(rowOf('Platform models')).getByText('Platform-provided')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add custom endpoint' })).toBeInTheDocument();
  });

  it('offers a retry when the keys cannot be loaded', async () => {
    renderPage([buildFailedLlmKeysMock(), buildLlmKeysMock([])]);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Platform models')).toBeInTheDocument();
  });

  it('checks a typed key, shows that it works and saves it', async () => {
    const input = { vendor: LlmKeyVendor.Openai, apiKey: VALID_API_KEY, baseUrl: null };
    renderPage([
      buildLlmKeysMock([ANTHROPIC_KEY]),
      buildCheckLlmKeyMock(input),
      buildAddLlmKeyMock({ ...input, name: null, fallbackToPlatform: false }, OPENAI_KEY),
      buildLlmKeysMock([ANTHROPIC_KEY, OPENAI_KEY]),
    ]);

    const user = userEvent.setup();
    await user.click(
      within(await waitFor(() => rowOf('OpenAI'))).getByRole('button', { name: 'Add key' }),
    );
    const dialog = await screen.findByRole('dialog');
    await typeKey(user);

    expect(
      await within(dialog).findByText(
        `Key works · ${CHECKED_MODELS.length} models available`,
        {},
        {
          timeout: CHECK_TIMEOUT_MS,
        },
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Checked just now')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Save key' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('OpenAI key saved')).toBeInTheDocument();
    expect(
      within(rowOf('OpenAI')).getByText('Key ends …5678 · added by Pavlo'),
    ).toBeInTheDocument();
  });

  it('disables saving when the check fails', async () => {
    const input = { vendor: LlmKeyVendor.Openai, apiKey: VALID_API_KEY, baseUrl: null };
    renderPage([
      buildLlmKeysMock([ANTHROPIC_KEY]),
      buildFailedCheckLlmKeyMock(input, ErrorReason.LlmKeyInvalid),
    ]);

    const user = userEvent.setup();
    await user.click(
      within(await waitFor(() => rowOf('OpenAI'))).getByRole('button', { name: 'Add key' }),
    );
    const dialog = await screen.findByRole('dialog');
    await typeKey(user);

    expect(
      await within(dialog).findByText(
        'The provider did not accept this key. Check it and try again.',
        {},
        { timeout: CHECK_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save key' })).toBeDisabled();
  });

  it('does not check a key that is too short', async () => {
    renderPage([buildLlmKeysMock([ANTHROPIC_KEY])]);

    const user = userEvent.setup();
    await user.click(
      within(await waitFor(() => rowOf('OpenAI'))).getByRole('button', { name: 'Add key' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(await screen.findByLabelText('API key'), 'short');

    expect(within(dialog).queryByText('Checking…')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save key' })).toBeDisabled();
  });

  it('turns the fallback to the platform model on and off for a key', async () => {
    renderPage([
      buildLlmKeysMock([ANTHROPIC_KEY]),
      buildSetLlmKeyFallbackMock(ANTHROPIC_KEY, true),
      buildLlmKeysMock([{ ...ANTHROPIC_KEY, fallbackToPlatform: true }]),
    ]);

    const user = userEvent.setup();
    const row = await waitFor(() => rowOf('Anthropic'));
    const toggle = within(row).getByRole('switch');
    expect(toggle).not.toBeChecked();
    await user.click(toggle);

    await waitFor(() => expect(within(rowOf('Anthropic')).getByRole('switch')).toBeChecked());
  });

  it('names the steps that use a key and refetches after removing it', async () => {
    renderPage([
      buildLlmKeysMock([ANTHROPIC_KEY]),
      buildRemoveLlmKeyMock(ANTHROPIC_KEY),
      buildLlmKeysMock([]),
    ]);

    const user = userEvent.setup();
    const row = await waitFor(() => rowOf('Anthropic'));
    await user.click(within(row).getByRole('button', { name: 'Remove key' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        '2 steps use this key. They will fail until you pick another model.',
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Remove key' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Anthropic key removed')).toBeInTheDocument();
    await waitFor(() => expect(within(rowOf('Anthropic')).getByText('No key')).toBeInTheDocument());
  });
});
