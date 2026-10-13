import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
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
  buildPromptLibraryMock,
  CONVERSATION_GUARD_PROMPT,
  GUARDS_FOLDER,
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
const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };
const NEW_PROMPT_NAME = 'Booking reminder';
const NEW_FOLDER_NAME = 'Messages';

describe('prompts page', () => {
  beforeEach(() => signInForTest());

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
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
    expect(await within(section).findByRole('button', { name: 'Q&A' })).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: 'Guards & tags' })).toBeInTheDocument();
    expect(within(section).getByText('Receptionist')).toBeInTheDocument();
    expect(within(section).getByText('Conversation guard')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No prompts yet' })).not.toBeInTheDocument();
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
        buildPromptLibraryMock(
          [{ id: NEW_FOLDER_ID, name: NEW_FOLDER_NAME }],
          [{ id: NEW_PROMPT_ID, name: NEW_PROMPT_NAME, folderId: NEW_FOLDER_ID }],
        ),
        buildCreatePromptFolderMock(NEW_FOLDER_NAME),
        buildCreatePromptMock(NEW_PROMPT_NAME, NEW_FOLDER_ID),
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
  });

  it('tells when the prompt name is taken', async () => {
    renderRoute(promptsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT]),
        buildCreatePromptConflictMock(RECEPTIONIST_PROMPT.name, Q_AND_A_FOLDER.id),
      ],
    });

    const section = await screen.findByRole('navigation', { name: 'Prompts' });
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

  it('keeps prompts hidden from an operator', async () => {
    renderRoute(promptsPath, { mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])] });

    expect(await screen.findByText('You don’t have access to Prompts')).toBeInTheDocument();
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).queryByRole('link', { name: 'Prompts' })).not.toBeInTheDocument();
  });
});
