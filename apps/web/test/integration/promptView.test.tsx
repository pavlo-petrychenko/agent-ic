import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildPromptDetailMock,
  buildSavePromptVersionMock,
  RECEPTIONIST_SAVED_VERSION,
  RECEPTIONIST_VERSION,
} from '@/features/prompts/communication/fixtures/promptDetail.fixture';
import {
  buildPromptLibraryMock,
  Q_AND_A_FOLDER,
  RECEPTIONIST_PROMPT,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import {
  readPromptDraft,
  storePromptDraft,
} from '@/features/prompts/storage/helpers/promptDraftStorage.helpers';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const promptsPath = `/w/${DEMO_WORKSPACE.id}/prompts`;
const promptPath = `${promptsPath}/${RECEPTIONIST_PROMPT.id}`;
const DRAFT_TEXT = 'Draft text for {{contact.name}}';

const promptMocks = () => [
  buildWorkspaceShellMock([DEMO_WORKSPACE]),
  buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
  buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION),
];

const seedDraft = () => {
  storePromptDraft(RECEPTIONIST_PROMPT.id, {
    text: DRAFT_TEXT,
    baseVersionNumber: RECEPTIONIST_VERSION.number,
  });
};

describe('prompt view', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    window.localStorage.clear();
    usePromptDraftsStore.setState({ drafts: {} });
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
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
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

  it('opens a stored draft for editing', async () => {
    seedDraft();
    renderRoute(promptPath, { mocks: promptMocks() });

    expect(
      await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Editing v${RECEPTIONIST_VERSION.number + 1} draft`),
    ).toBeInTheDocument();
    expect(screen.getByText(`based on v${RECEPTIONIST_VERSION.number}`)).toBeInTheDocument();

    const field = screen.getByRole('textbox', { name: 'Prompt text' });
    expect(field).toHaveAttribute('contenteditable', 'true');
    expect(field).toHaveTextContent(DRAFT_TEXT);
  });

  it('keeps edits in the browser and marks the prompt in the section', async () => {
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
      ],
    });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Prompt text' }), 'Hello');

    await waitFor(() => expect(readPromptDraft(RECEPTIONIST_PROMPT.id)?.text).toBe('Hello'));
    expect(screen.getByText('v1 draft')).toBeInTheDocument();
    expect(screen.getByText('never saved')).toBeInTheDocument();
    const section = screen.getByRole('navigation', { name: 'Prompts' });
    const link = await within(section).findByRole('link', { name: /receptionist/i });
    expect(link).toHaveTextContent('draft');
  });

  it('saves the draft as a new version', async () => {
    const note = 'Reply in 1–3 messages';
    seedDraft();
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION, 1),
        buildSavePromptVersionMock(
          RECEPTIONIST_PROMPT,
          RECEPTIONIST_SAVED_VERSION,
          DRAFT_TEXT,
          note,
        ),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_SAVED_VERSION, 1),
      ],
    });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(
      await screen.findByRole('button', { name: `Save as v${RECEPTIONIST_SAVED_VERSION.number}` }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: `Save as v${RECEPTIONIST_SAVED_VERSION.number}`,
    });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'What changed' }), note);
    await userEvent.click(
      within(dialog).getByRole('button', { name: `Save v${RECEPTIONIST_SAVED_VERSION.number}` }),
    );

    expect(
      await screen.findByText(`v${RECEPTIONIST_SAVED_VERSION.number} · latest`),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(`Saved v${RECEPTIONIST_SAVED_VERSION.number}`),
    ).toBeInTheDocument();
    expect(readPromptDraft(RECEPTIONIST_PROMPT.id)).toBeNull();
    expect(screen.getByText('Read-only — Edit creates a draft')).toBeInTheDocument();
  });

  it('discards the draft', async () => {
    seedDraft();
    renderRoute(promptPath, { mocks: promptMocks() });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(await screen.findByRole('button', { name: 'Discard draft' }));

    const dialog = await screen.findByRole('dialog', {
      name: `Discard the v${RECEPTIONIST_VERSION.number + 1} draft?`,
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard draft' }));

    await waitFor(() => expect(readPromptDraft(RECEPTIONIST_PROMPT.id)).toBeNull());
    expect(screen.getByText('Read-only — Edit creates a draft')).toBeInTheDocument();
    expect(screen.queryByText(`Editing v${RECEPTIONIST_VERSION.number + 1} draft`)).toBeNull();
  });
});
