import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

describe('prompts page', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('opens from the sidebar and shows the empty state', async () => {
    renderRoute(promptsPath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildPromptLibraryMock([], [])],
    });

    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Prompts' })).toHaveAttribute('href', promptsPath);
    expect(await screen.findByRole('heading', { name: 'Prompts' })).toBeInTheDocument();
    expect(
      screen.getByText('Reusable instructions for Agent and Completion steps'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No prompts yet' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Write a prompt once and use it in many steps. Versions let you change it safely.',
      ),
    ).toBeInTheDocument();
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
    expect(await screen.findByRole('heading', { name: 'Select a prompt' })).toBeInTheDocument();
  });

  it('keeps prompts hidden from an operator', async () => {
    renderRoute(promptsPath, { mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])] });

    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).queryByRole('link', { name: 'Prompts' })).not.toBeInTheDocument();
    expect(await screen.findByText('You don’t have access to Prompts')).toBeInTheDocument();
  });
});
