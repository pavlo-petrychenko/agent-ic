import { WorkspaceRole } from '@agent-ic/contracts';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildCreatePromptConflictMock,
  buildCreatePromptFolderMock,
  buildCreatePromptMock,
  NEW_FOLDER_ID,
  NEW_PROMPT_ID,
} from '@/features/prompts/communication/fixtures/promptCreate.fixture';
import {
  buildPromptDetailMock,
  buildPromptVersionsMock,
} from '@/features/prompts/communication/fixtures/promptDetail.fixture';
import {
  buildDeletePromptFolderMock,
  buildRenamePromptFolderConflictMock,
  buildRenamePromptFolderMock,
  RENAMED_FOLDER_NAME,
} from '@/features/prompts/communication/fixtures/promptFolderActions.fixture';
import {
  buildPromptLibraryMock,
  CONVERSATION_GUARD_PROMPT,
  GIFT_CARD_PROMPT,
  GUARDS_FOLDER,
  Q_AND_A_FOLDER,
  RECEPTIONIST_PROMPT,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import type { PromptFixture } from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import {
  PROMPT_LAST_OPENED_KEY_SEPARATOR,
  PROMPT_LAST_OPENED_STORAGE_KEY_PREFIX,
} from '@/features/prompts/constants/promptLastOpened.constants';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const promptsPath = `/w/${DEMO_WORKSPACE.id}/prompts`;
const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };
const NEW_PROMPT_NAME = 'Booking reminder';
const NEW_FOLDER_NAME = 'Messages';
const NEW_PROMPT: PromptFixture = {
  id: NEW_PROMPT_ID,
  name: NEW_PROMPT_NAME,
  folderId: NEW_FOLDER_ID,
  latestVersionNumber: null,
  updatedAt: '2026-10-16T12:00:00.000Z',
};

describe('prompts page', () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInForTest();
  });

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('opens from the sidebar and offers to create a prompt', async () => {
    renderRoute(promptsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildPromptLibraryMock([], [])],
    });

    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(await within(nav).findByRole('link', { name: 'Prompts' })).toHaveAttribute(
      'href',
      promptsPath,
    );
    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    expect(await within(section).findByRole('button', { name: 'New prompt' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Prompts' })).toBeInTheDocument();
    expect(
      screen.getByText('Reusable instructions for Agent and Completion steps'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No prompts yet' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'New prompt' })).toHaveLength(2);
  });

  it('lists folders with their prompts in the section', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock(
          [Q_AND_A_FOLDER, GUARDS_FOLDER],
          [RECEPTIONIST_PROMPT, CONVERSATION_GUARD_PROMPT],
        ),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, []),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    expect(await within(section).findByRole('button', { name: 'Q&A' })).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: 'Guards & tags' })).toBeInTheDocument();
    expect(within(section).getByText('Receptionist')).toBeInTheDocument();
    expect(within(section).getByText('Conversation guard')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No prompts yet' })).not.toBeInTheDocument();
  });

  it('opens the most recently updated prompt', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT, GIFT_CARD_PROMPT]),
        buildPromptDetailMock(GIFT_CARD_PROMPT, null),
        buildPromptVersionsMock(GIFT_CARD_PROMPT, []),
      ],
    });

    expect(await screen.findByRole('heading', { name: GIFT_CARD_PROMPT.name })).toBeInTheDocument();
  });

  it('opens the last opened prompt', async () => {
    window.localStorage.setItem(
      `${PROMPT_LAST_OPENED_STORAGE_KEY_PREFIX}${PROMPT_LAST_OPENED_KEY_SEPARATOR}${DEMO_WORKSPACE.id}`,
      RECEPTIONIST_PROMPT.id,
    );

    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT, GIFT_CARD_PROMPT]),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, []),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: RECEPTIONIST_PROMPT.name }),
    ).toBeInTheDocument();
  });

  it('requires a name and a folder', async () => {
    renderRoute(promptsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildPromptLibraryMock([], [])],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    await userEvent.click(await within(section).findByRole('button', { name: 'New prompt' }));

    const dialog = await screen.findByRole('dialog', { name: 'New prompt' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create prompt' }));

    expect(
      await within(dialog).findByText('Enter a prompt name of up to 100 characters.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Choose a folder or type a new name of up to 60 characters.'),
    ).toBeInTheDocument();
  });

  it('creates a prompt in a new folder from the section', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([], [], 1),
        buildPromptLibraryMock([{ id: NEW_FOLDER_ID, name: NEW_FOLDER_NAME }], [NEW_PROMPT]),
        buildCreatePromptFolderMock(NEW_FOLDER_NAME),
        buildCreatePromptMock(NEW_PROMPT_NAME, NEW_FOLDER_ID),
        buildPromptDetailMock(NEW_PROMPT, null),
        buildPromptVersionsMock(NEW_PROMPT, []),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    await userEvent.click(await within(section).findByRole('button', { name: 'New prompt' }));

    const dialog = await screen.findByRole('dialog', { name: 'New prompt' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Name' }), NEW_PROMPT_NAME);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Folder' }));
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search folders' }),
      NEW_FOLDER_NAME,
    );
    await userEvent.click(screen.getByRole('button', { name: `Create “${NEW_FOLDER_NAME}”` }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create prompt' }));

    expect(await screen.findByText(`Prompt “${NEW_PROMPT_NAME}” created`)).toBeInTheDocument();
    expect(within(section).getByText(NEW_PROMPT_NAME)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: NEW_PROMPT_NAME })).toBeInTheDocument();
  });

  it('tells when the prompt name is taken', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildCreatePromptConflictMock(RECEPTIONIST_PROMPT.name, Q_AND_A_FOLDER.id),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, []),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    await within(section).findByRole('button', { name: Q_AND_A_FOLDER.name });
    await userEvent.click(await within(section).findByRole('button', { name: 'New prompt' }));

    const dialog = await screen.findByRole('dialog', { name: 'New prompt' });
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      RECEPTIONIST_PROMPT.name,
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create prompt' }));

    expect(
      await within(dialog).findByText('A prompt with this name already exists.'),
    ).toBeInTheDocument();
  });

  it('renames a folder from the section', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT], 1),
        buildPromptLibraryMock(
          [{ id: Q_AND_A_FOLDER.id, name: RENAMED_FOLDER_NAME }],
          [RECEPTIONIST_PROMPT],
        ),
        buildRenamePromptFolderMock(Q_AND_A_FOLDER.id, RENAMED_FOLDER_NAME),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
        buildPromptVersionsMock(RECEPTIONIST_PROMPT, []),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    fireEvent.contextMenu(
      await within(section).findByRole('button', { name: Q_AND_A_FOLDER.name }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rename folder' });
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    expect(name).toHaveValue(Q_AND_A_FOLDER.name);

    await userEvent.clear(name);
    await userEvent.type(name, RENAMED_FOLDER_NAME);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rename' }));

    expect(await screen.findByText(`Folder “${RENAMED_FOLDER_NAME}” renamed`)).toBeInTheDocument();
    expect(
      await within(section).findByRole('button', { name: RENAMED_FOLDER_NAME }),
    ).toBeInTheDocument();
  });

  it('tells when the renamed folder name is taken', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER, GUARDS_FOLDER], []),
        buildRenamePromptFolderConflictMock(GUARDS_FOLDER.id, Q_AND_A_FOLDER.name),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    fireEvent.contextMenu(await within(section).findByRole('button', { name: GUARDS_FOLDER.name }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rename folder' });
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    await userEvent.clear(name);
    await userEvent.type(name, Q_AND_A_FOLDER.name);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rename' }));

    expect(
      await within(dialog).findByText('A folder with this name already exists.'),
    ).toBeInTheDocument();
  });

  it('deletes an empty folder from the section', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([GUARDS_FOLDER], [], 1),
        buildPromptLibraryMock([], []),
        buildDeletePromptFolderMock(GUARDS_FOLDER.id),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    fireEvent.contextMenu(await within(section).findByRole('button', { name: GUARDS_FOLDER.name }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    const dialog = await screen.findByRole('dialog', {
      name: `Delete “${GUARDS_FOLDER.name}”?`,
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(`Folder “${GUARDS_FOLDER.name}” deleted`)).toBeInTheDocument();
    expect(await within(section).findByText('No prompts yet')).toBeInTheDocument();
    expect(
      within(section).queryByRole('button', { name: GUARDS_FOLDER.name }),
    ).not.toBeInTheDocument();
  });

  it('keeps a folder that still has prompts', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildPromptDetailMock(RECEPTIONIST_PROMPT, null),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    fireEvent.contextMenu(
      await within(section).findByRole('button', { name: Q_AND_A_FOLDER.name }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    const dialog = await screen.findByRole('dialog', {
      name: `Delete “${Q_AND_A_FOLDER.name}”?`,
    });

    expect(
      within(dialog).getByText(
        'This folder isn’t empty. Move its prompts to another folder first.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('keeps prompts hidden from an operator', async () => {
    renderRoute(promptsPath, { mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])] });

    expect(await screen.findByText('You don’t have access to Prompts')).toBeInTheDocument();
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).queryByRole('link', { name: 'Prompts' })).not.toBeInTheDocument();
  });
});
