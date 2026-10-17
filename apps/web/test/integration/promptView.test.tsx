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
  buildPromptVersionMock,
  buildPromptVersionsMock,
  buildSavePromptVersionMock,
  RECEPTIONIST_PREVIOUS_VERSION,
  RECEPTIONIST_SAVED_VERSION,
  RECEPTIONIST_VERSION,
  RECEPTIONIST_VERSIONS,
} from '@/features/prompts/communication/fixtures/promptDetail.fixture';
import {
  buildPromptLibraryMock,
  CONVERSATION_GUARD_PROMPT,
  GUARDS_FOLDER,
  Q_AND_A_FOLDER,
  RECEPTIONIST_PROMPT,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import type { PromptFixture } from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
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

const promptLinkName = (prompt: PromptFixture): RegExp => {
  const name = prompt.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const version = prompt.latestVersionNumber === null ? '' : `\\s*v${prompt.latestVersionNumber}`;
  return new RegExp(`^${name}${version}$`);
};

const promptMocks = () => [
  buildWorkspaceShellMock([DEMO_WORKSPACE]),
  buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
  buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION),
  buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS),
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
      await within(section).findByRole('link', { name: promptLinkName(RECEPTIONIST_PROMPT) }),
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

  it('lists the saved versions with their notes and dates', async () => {
    renderRoute(promptPath, { mocks: promptMocks() });

    const panel = await screen.findByRole('complementary', { name: 'Prompt details' });
    expect(await within(panel).findByRole('heading', { name: 'Versions' })).toBeInTheDocument();

    const list = await within(panel).findByRole('list', { name: 'Versions' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(RECEPTIONIST_VERSIONS.length);
    expect(await within(list).findByText(`v${RECEPTIONIST_VERSION.number}`)).toBeInTheDocument();
    expect(within(list).getByText('Offer a manager when unsure')).toBeInTheDocument();
    expect(within(list).getByText('Sep 17')).toBeInTheDocument();
    expect(within(list).queryAllByRole('link')).toHaveLength(0);
    expect(within(list).getAllByRole('button')).toHaveLength(RECEPTIONIST_VERSIONS.length - 1);
    expect(within(list).getByText(`v${RECEPTIONIST_VERSION.number}`).closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(within(list).getByText('v3').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('opens an older version from the list and returns to the latest', async () => {
    renderRoute(promptPath, {
      mocks: [...promptMocks(), buildPromptVersionMock(RECEPTIONIST_PREVIOUS_VERSION)],
    });

    const panel = await screen.findByRole('complementary', { name: 'Prompt details' });
    const list = await within(panel).findByRole('list', { name: 'Versions' });
    await userEvent.click(
      await within(list).findByRole('button', {
        name: `View v${RECEPTIONIST_PREVIOUS_VERSION.number}`,
      }),
    );

    expect(await screen.findByText(/You’re viewing an older version/)).toBeInTheDocument();
    expect(
      await screen.findByText(`Saved Sep 10 by ${RECEPTIONIST_PREVIOUS_VERSION.authorName}`),
    ).toBeInTheDocument();
    expect(within(list).getByText('v3').closest('li')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('textbox', { name: 'Prompt text' })).toHaveTextContent(
      'Answer only from the knowledge search results.',
    );
    expect(screen.queryByText(`v${RECEPTIONIST_VERSION.number} · latest`)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: `Back to latest (v${RECEPTIONIST_VERSION.number})` }),
    );

    expect(await screen.findByText(`v${RECEPTIONIST_VERSION.number} · latest`)).toBeInTheDocument();
    expect(within(list).getByText(`v${RECEPTIONIST_VERSION.number}`).closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('restores an older version as a draft', async () => {
    renderRoute(promptPath, {
      mocks: [...promptMocks(), buildPromptVersionMock(RECEPTIONIST_PREVIOUS_VERSION)],
    });

    const panel = await screen.findByRole('complementary', { name: 'Prompt details' });
    const list = await within(panel).findByRole('list', { name: 'Versions' });
    await userEvent.click(
      await within(list).findByRole('button', {
        name: `View v${RECEPTIONIST_PREVIOUS_VERSION.number}`,
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Restore as draft' }));

    const draft = readPromptDraft(RECEPTIONIST_PROMPT.id);
    expect(draft?.text).toBe(RECEPTIONIST_PREVIOUS_VERSION.text);
    expect(draft?.baseVersionNumber).toBe(RECEPTIONIST_PREVIOUS_VERSION.number);
    expect(
      screen.getByText(`Editing v${RECEPTIONIST_VERSION.number + 1} draft`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`based on v${RECEPTIONIST_PREVIOUS_VERSION.number}`),
    ).toBeInTheDocument();
    const field = screen.getByRole('textbox', { name: 'Prompt text' });
    expect(field).toHaveAttribute('contenteditable', 'true');
    expect(field).toHaveTextContent('Answer only from the knowledge search results.');
  });

  it('shows an empty field for a prompt without versions', async () => {
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, []),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/· latest/)).not.toBeInTheDocument();
    expect(screen.getByText('This prompt has no text yet.')).toBeInTheDocument();
    expect(await screen.findByText('No versions yet. Saving creates v1.')).toBeInTheDocument();
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

    const panel = screen.getByRole('complementary', { name: 'Prompt details' });
    const latestRow = (await within(panel).findByText(`v${RECEPTIONIST_VERSION.number}`)).closest(
      'li',
    );
    expect(latestRow).not.toHaveAttribute('aria-current');
  });

  it('keeps edits in the browser and marks the prompt in the section', async () => {
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, []),
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
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION, 1),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS, 1),
        buildPromptLibraryMock(
          [Q_AND_A_FOLDER],
          [{ ...RECEPTIONIST_PROMPT, latestVersionNumber: RECEPTIONIST_SAVED_VERSION.number }],
        ),
        buildSavePromptVersionMock(
          RECEPTIONIST_PROMPT,
          RECEPTIONIST_SAVED_VERSION,
          DRAFT_TEXT,
          note,
        ),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_SAVED_VERSION, 1),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, [
          RECEPTIONIST_SAVED_VERSION,
          ...RECEPTIONIST_VERSIONS,
        ]),
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
    const panel = screen.getByRole('complementary', { name: 'Prompt details' });
    const savedRow = (
      await within(panel).findByText(`v${RECEPTIONIST_SAVED_VERSION.number}`)
    ).closest('li');
    expect(savedRow).toHaveAttribute('aria-current', 'true');
    expect(within(panel).getByText(note)).toBeInTheDocument();
    expect(
      await within(screen.getByRole('navigation', { name: 'Prompts' })).findByRole('link', {
        name: promptLinkName({
          ...RECEPTIONIST_PROMPT,
          latestVersionNumber: RECEPTIONIST_SAVED_VERSION.number,
        }),
      }),
    ).toBeInTheDocument();
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
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS),
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
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS),
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
      expect(
        within(section).queryByRole('link', { name: promptLinkName(RECEPTIONIST_PROMPT) }),
      ).toBeNull(),
    );
  });

  it('moves the prompt to another folder from the actions menu', async () => {
    const moved = { ...RECEPTIONIST_PROMPT, folderId: GUARDS_FOLDER.id };
    renderRoute(promptPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER, GUARDS_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSION, 1),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS),
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
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS),
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
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS),
        buildDuplicatePromptMock(RECEPTIONIST_PROMPT, copy),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT, copy], 1),
        buildPromptDetailMock(copy, RECEPTIONIST_VERSION, 1),
        buildPromptVersionsMock(copy, RECEPTIONIST_VERSIONS),
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
    await within(section).findByRole('link', { name: promptLinkName(RECEPTIONIST_PROMPT) });
    await userEvent.type(
      within(section).getByRole('searchbox', { name: 'Search prompts' }),
      'guard',
    );

    await waitFor(() =>
      expect(
        within(section).queryByRole('link', { name: promptLinkName(RECEPTIONIST_PROMPT) }),
      ).toBeNull(),
    );
    expect(
      within(section).getByRole('link', { name: promptLinkName(CONVERSATION_GUARD_PROMPT) }),
    ).toBeInTheDocument();
    expect(within(section).queryByRole('button', { name: Q_AND_A_FOLDER.name })).toBeNull();

    await userEvent.click(within(section).getByRole('button', { name: 'Clear search' }));
    expect(
      await within(section).findByRole('link', { name: promptLinkName(RECEPTIONIST_PROMPT) }),
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
    await userEvent.type(within(section).getByRole('searchbox', { name: 'Search prompts' }), 'zzz');

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
        within(section).queryByRole('link', { name: promptLinkName(CONVERSATION_GUARD_PROMPT) }),
      ).toBeNull(),
    );

    await userEvent.type(
      within(section).getByRole('searchbox', { name: 'Search prompts' }),
      'guard',
    );

    expect(
      await within(section).findByRole('link', { name: promptLinkName(CONVERSATION_GUARD_PROMPT) }),
    ).toBeInTheDocument();
  });
});
