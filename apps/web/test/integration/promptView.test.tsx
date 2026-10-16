import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildDeletePromptMock,
  buildDuplicatePromptMock,
  buildMovePromptMock,
  buildRenamePromptMock,
} from '@/features/prompts/communication/fixtures/promptActions.fixture';
import {
  buildCreatePromptFolderMock,
  NEW_FOLDER_ID,
} from '@/features/prompts/communication/fixtures/promptCreate.fixture';
import {
  buildPromptDetailMock,
  buildSavePromptVersionMock,
  RECEPTIONIST_SAVED_VERSION,
  RECEPTIONIST_VERSION,
} from '@/features/prompts/communication/fixtures/promptDetail.fixture';
import {
  buildPromptLibraryMock,
  CONVERSATION_GUARD_PROMPT,
  GUARDS_FOLDER,
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

  it('renames the prompt from the actions menu', async () => {
    const renamed = { ...RECEPTIONIST_PROMPT, name: 'Receptionist Q&A' };
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION, 1),
        buildRenamePromptMock(RECEPTIONIST_PROMPT, renamed.name),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [renamed], 1),
        buildPromptDetailMock(renamed, RECEPTIONIST_VERSION, 1),
      ],
    });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(await screen.findByRole('button', { name: 'Prompt actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rename prompt' });
    const field = within(dialog).getByRole('textbox', { name: 'Name' });
    await userEvent.clear(field);
    await userEvent.type(field, renamed.name);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rename' }));

    expect(await screen.findByRole('heading', { name: renamed.name })).toBeInTheDocument();
    expect(await screen.findByText(`Prompt “${renamed.name}” renamed`)).toBeInTheDocument();
  });

  it('deletes the prompt from the actions menu', async () => {
    const { router } = renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION),
        buildDeletePromptMock(RECEPTIONIST_PROMPT),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [], 1),
      ],
    });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(await screen.findByRole('button', { name: 'Prompt actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete prompt' }));

    const dialog = await screen.findByRole('dialog', {
      name: `Delete “${RECEPTIONIST_PROMPT.name}”?`,
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete prompt' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(promptsPath));
    expect(
      await screen.findByText(`Prompt “${RECEPTIONIST_PROMPT.name}” deleted`),
    ).toBeInTheDocument();
    const section = screen.getByRole('navigation', { name: 'Prompts' });
    await waitFor(() =>
      expect(within(section).queryByRole('link', { name: RECEPTIONIST_PROMPT.name })).toBeNull(),
    );
  });

  it('moves the prompt to another folder from the actions menu', async () => {
    const moved = { ...RECEPTIONIST_PROMPT, folderId: GUARDS_FOLDER.id };
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER, GUARDS_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION, 1),
        buildMovePromptMock(RECEPTIONIST_PROMPT, GUARDS_FOLDER.id),
        buildPromptLibraryMock([Q_AND_A_FOLDER, GUARDS_FOLDER], [moved], 1),
        buildPromptDetailMock(moved, RECEPTIONIST_VERSION, 1),
      ],
    });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(await screen.findByRole('button', { name: 'Prompt actions' }));
    const moveItem = await screen.findByRole('menuitem', { name: /Move to folder/ });
    expect(moveItem).toHaveTextContent(Q_AND_A_FOLDER.name);
    await userEvent.click(moveItem);

    const dialog = await screen.findByRole('dialog', { name: 'Move to folder' });
    const submit = within(dialog).getByRole('button', { name: 'Move' });
    expect(submit).toBeDisabled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Folder' }));
    await userEvent.click(await screen.findByRole('button', { name: GUARDS_FOLDER.name }));
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    expect(
      await screen.findByText(
        `Prompt “${RECEPTIONIST_PROMPT.name}” moved to “${GUARDS_FOLDER.name}”`,
      ),
    ).toBeInTheDocument();
  });

  it('creates a new folder and moves the prompt into it', async () => {
    const folderName = 'Messages';
    const created = { id: NEW_FOLDER_ID, name: folderName };
    const moved = { ...RECEPTIONIST_PROMPT, folderId: NEW_FOLDER_ID };
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION, 1),
        buildCreatePromptFolderMock(folderName),
        buildPromptLibraryMock([Q_AND_A_FOLDER, created], [RECEPTIONIST_PROMPT], 1),
        buildMovePromptMock(RECEPTIONIST_PROMPT, NEW_FOLDER_ID),
        buildPromptLibraryMock([Q_AND_A_FOLDER, created], [moved], 1),
        buildPromptDetailMock(moved, RECEPTIONIST_VERSION, 1),
      ],
    });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(await screen.findByRole('button', { name: 'Prompt actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Move to folder/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Move to folder' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Folder' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search folders' }), folderName);
    await userEvent.click(screen.getByRole('button', { name: `Create “${folderName}”` }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }));

    expect(
      await screen.findByText(`Prompt “${RECEPTIONIST_PROMPT.name}” moved to “${folderName}”`),
    ).toBeInTheDocument();
    const section = screen.getByRole('navigation', { name: 'Prompts' });
    expect(await within(section).findByRole('button', { name: folderName })).toBeInTheDocument();
  });

  it('duplicates the prompt from the actions menu and opens the copy', async () => {
    const copy = {
      ...RECEPTIONIST_PROMPT,
      id: `${RECEPTIONIST_PROMPT.id}_copy`,
      name: `${RECEPTIONIST_PROMPT.name} (copy)`,
    };
    const { router } = renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION, 1),
        buildDuplicatePromptMock(RECEPTIONIST_PROMPT, copy),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT, copy], 1),
        buildPromptDetailMock(copy, RECEPTIONIST_VERSION, 1),
      ],
    });

    await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.click(await screen.findByRole('button', { name: 'Prompt actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Duplicate' }));

    expect(await screen.findByText(`Duplicated as “${copy.name}”`)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: copy.name })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe(`${promptsPath}/${copy.id}`));
  });

  it('searches prompts from the section', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock(
          [Q_AND_A_FOLDER, GUARDS_FOLDER],
          [RECEPTIONIST_PROMPT, CONVERSATION_GUARD_PROMPT],
        ),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    await within(section).findByRole('link', { name: RECEPTIONIST_PROMPT.name });
    await userEvent.type(within(section).getByRole('textbox', { name: 'Search prompts' }), 'guard');

    await waitFor(() =>
      expect(within(section).queryByRole('link', { name: RECEPTIONIST_PROMPT.name })).toBeNull(),
    );
    expect(
      within(section).getByRole('link', { name: CONVERSATION_GUARD_PROMPT.name }),
    ).toBeInTheDocument();
    expect(within(section).queryByRole('button', { name: Q_AND_A_FOLDER.name })).toBeNull();

    await userEvent.click(within(section).getByRole('button', { name: 'Clear search' }));
    expect(
      await within(section).findByRole('link', { name: RECEPTIONIST_PROMPT.name }),
    ).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: Q_AND_A_FOLDER.name })).toBeInTheDocument();
  });

  it('shows a message when no prompt matches the search', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    await userEvent.type(within(section).getByRole('textbox', { name: 'Search prompts' }), 'zzz');

    expect(await within(section).findByText('No prompts found')).toBeInTheDocument();
  });

  it('reveals matches inside a collapsed folder while searching', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock(
          [Q_AND_A_FOLDER, GUARDS_FOLDER],
          [RECEPTIONIST_PROMPT, CONVERSATION_GUARD_PROMPT],
        ),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    await userEvent.click(await within(section).findByRole('button', { name: GUARDS_FOLDER.name }));
    await waitFor(() =>
      expect(
        within(section).queryByRole('link', { name: CONVERSATION_GUARD_PROMPT.name }),
      ).toBeNull(),
    );

    await userEvent.type(within(section).getByRole('textbox', { name: 'Search prompts' }), 'guard');

    expect(
      await within(section).findByRole('link', { name: CONVERSATION_GUARD_PROMPT.name }),
    ).toBeInTheDocument();
  });
});
