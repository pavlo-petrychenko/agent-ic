import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildLlmCatalogMock } from '@/features/settings/communication/fixtures/llmCatalog.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const settingsPath = `/w/${DEMO_WORKSPACE.id}/settings`;
const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };
const PROVIDERS = ['OpenAI', 'Anthropic', 'Google', 'Mistral', 'Xiaomi', 'Zhipu', 'DeepSeek'];

const providerRow = (provider: string): HTMLElement => {
  const row = screen.getByText(provider).closest('li');
  if (row === null) {
    throw new Error(`No row for ${provider}`);
  }
  return row;
};

const pageAddButton = (): HTMLElement => {
  const button = screen
    .getAllByRole('button', { name: 'Add key' })
    .find((entry) => entry.closest('li') === null);
  if (button === undefined) {
    throw new Error('No page-level Add key button');
  }
  return button;
};

describe('llm keys settings', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('lists the platform models and every provider with its key state', async () => {
    renderRoute(`${settingsPath}/llm`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildLlmCatalogMock()],
    });

    expect(await screen.findByRole('heading', { name: 'LLM keys' })).toBeInTheDocument();
    expect(screen.getByText('Platform models or bring your own key')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Platform models')).toBeInTheDocument();
    expect(
      await screen.findByText('Strong model, Fast model · counted in your usage limit'),
    ).toBeInTheDocument();
    expect(screen.getByText('Platform-provided')).toBeInTheDocument();

    for (const provider of PROVIDERS) {
      expect(screen.getByText(provider)).toBeInTheDocument();
    }
    expect(
      screen.getByText('Key ends …41aa · added by Pavlo · used by 2 steps'),
    ).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getAllByText('No key')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Remove key' })).toBeInTheDocument();
  });

  it('opens the dialog from the page-level Add key button', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/llm`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildLlmCatalogMock()],
    });

    await screen.findByText('OpenAI');
    await user.click(pageAddButton());

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Add a key for OpenAI' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox')).toHaveValue('openai');
  });

  it('removes a key after the password confirmation', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/llm`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildLlmCatalogMock()],
    });

    await user.click(await screen.findByRole('button', { name: 'Remove key' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Remove the Anthropic key?' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("This can't be undone.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Remove key' }));

    expect(await screen.findByText('Anthropic key removed')).toBeInTheDocument();
    expect(screen.getAllByText('No key')).toHaveLength(7);
    expect(screen.queryByRole('button', { name: 'Remove key' })).not.toBeInTheDocument();
  });

  it('adds a key for a provider through the dialog', async () => {
    const user = userEvent.setup();
    renderRoute(`${settingsPath}/llm`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildLlmCatalogMock()],
    });

    await screen.findByText('OpenAI');
    await user.click(within(providerRow('OpenAI')).getByRole('button', { name: 'Add key' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Add a key for OpenAI' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Use your own account for this provider's models"),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox')).toHaveValue('openai');

    await user.type(within(dialog).getByLabelText('API key'), 'sk-9999');

    expect(within(dialog).getByLabelText('API key')).toHaveValue('sk-••••');
    expect(within(dialog).getByText('Key works · 2 models available')).toBeInTheDocument();
    expect(within(dialog).getByText('Checked just now')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Save key' }));

    expect(await screen.findByText('OpenAI key saved')).toBeInTheDocument();
    expect(screen.getByText('Key ends …9999 · added by Pavlo')).toBeInTheDocument();
  });

  it('keeps LLM keys away from an operator', async () => {
    renderRoute(`${settingsPath}/llm`, {
      mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])],
    });

    expect(
      await screen.findByRole('heading', { name: 'You don’t have access to LLM keys' }),
    ).toBeInTheDocument();
  });
});
