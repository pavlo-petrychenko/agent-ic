import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildPromptDetailMock,
  RECEPTIONIST_VERSION,
} from '@/features/prompts/communication/fixtures/promptDetail.fixture';
import {
  buildPromptLibraryMock,
  Q_AND_A_FOLDER,
  RECEPTIONIST_PROMPT,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const promptsPath = `/w/${DEMO_WORKSPACE.id}/prompts`;
const promptPath = `${promptsPath}/${RECEPTIONIST_PROMPT.id}`;

const promptMocks = () => [
  buildWorkspaceShellMock([DEMO_WORKSPACE]),
  buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
  buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION),
];

describe('prompt view', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('opens a prompt from the section', async () => {
    const { router } = renderRoute(promptsPath, { mocks: promptMocks() });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    await userEvent.click(
      await within(section).findByRole('link', { name: RECEPTIONIST_PROMPT.name }),
    );

    expect(
      await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(promptPath);
  });

  it('shows the latest version read-only', async () => {
    renderRoute(promptPath, { mocks: promptMocks() });

    expect(
      await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(`v${RECEPTIONIST_VERSION.number} · latest`)).toBeInTheDocument();
    expect(
      screen.getByText(`Saved Sep 17 by ${RECEPTIONIST_VERSION.authorName}`),
    ).toBeInTheDocument();

    const field = screen.getByRole('textbox', { name: 'Prompt text' });
    expect(field).toHaveAttribute('contenteditable', 'false');
    expect(field).toHaveTextContent('You are the receptionist of Demo salon.');
    expect(screen.getByText('Read-only — Edit creates a draft')).toBeInTheDocument();
  });

  it('shows the version tag and the read-only note above the field', async () => {
    renderRoute(promptPath, { mocks: promptMocks() });

    const tag = await screen.findByText(`v${RECEPTIONIST_VERSION.number} · latest`);
    const note = screen.getByText('Read-only — Edit creates a draft');
    const field = screen.getByRole('textbox', { name: 'Prompt text' });

    expect(tag.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(note.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it('shows an empty field for a prompt without versions', async () => {
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/· latest/)).not.toBeInTheDocument();
    expect(screen.getByText('This prompt has no text yet.')).toBeInTheDocument();
  });
});
