import { NodeType, PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { PromptSource } from '@agent-ic/flow';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_AGENT_ID,
  TRIGGER_ONLY_FLOW,
  buildFlowBuilderDraftMock,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { modelOptionsMock } from '@/features/flow-builder/communication/fixtures/modelOptions.fixture';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { updateLlmStep } from '@/features/flow-builder/logic/helpers/llmStep.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import {
  RECEPTIONIST_VERSIONS,
  buildPromptVersionsMock,
} from '@/features/prompts/communication/fixtures/promptDetail.fixture';
import {
  GIFT_CARD_PROMPT,
  Q_AND_A_FOLDER,
  RECEPTIONIST_PROMPT,
  buildPromptLibraryMock,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import {
  DEMO_WORKSPACE,
  buildWorkspaceShellMock,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const builderPath = `/w/${DEMO_WORKSPACE.id}/agents/${DEMO_AGENT_ID}`;
const shell = buildWorkspaceShellMock([DEMO_WORKSPACE]);
const library = buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT, GIFT_CARD_PROMPT]);
const versions = buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS);
const step = () =>
  useFlowBuilderStore.getState().document.nodes.find((node) => node.id === 'agent');

const withAgentPrompt = (prompt: PromptSource | null) => {
  const document = addNode(TRIGGER_ONLY_FLOW, NodeType.Agent, { x: 0, y: 200 }, 'agent');
  return updateLlmStep(document, 'agent', { prompt });
};

const openStep = async (prompt: PromptSource | null) => {
  renderRoute(builderPath, {
    mocks: [
      shell,
      buildFlowBuilderDraftMock(withAgentPrompt(prompt)),
      modelOptionsMock(),
      library,
      versions,
    ],
  });
  await screen.findByRole('region', { name: 'Flow canvas' });
  act(() => {
    useFlowBuilderStore.getState().select({ nodeIds: ['agent'], edgeIds: [] });
  });
  return screen.findByRole('complementary', { name: 'agent' });
};

describe('flow builder prompt picker', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    vi.restoreAllMocks();
    await signOutForTest();
  });

  it('picks a library prompt for a step', async () => {
    const inspector = await openStep({ kind: PromptSourceKind.Inline, text: 'Hi' });

    await userEvent.click(within(inspector).getByRole('button', { name: 'Use a library prompt' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Gift card answers' }));

    expect(step()?.config).toMatchObject({
      prompt: {
        kind: PromptSourceKind.Library,
        promptRef: GIFT_CARD_PROMPT.id,
        pin: { kind: PromptVersionKind.Latest },
      },
    });
  });

  it('shows the picked prompt with its pin and writes a pin change', async () => {
    const inspector = await openStep({
      kind: PromptSourceKind.Library,
      promptRef: RECEPTIONIST_PROMPT.id,
      pin: { kind: PromptVersionKind.Latest },
    });

    expect(await within(inspector).findByText('Receptionist')).toBeVisible();
    expect(within(inspector).getByText('Q&A')).toBeVisible();
    await within(inspector).findByRole('option', { name: 'v2' });

    await userEvent.selectOptions(
      within(inspector).getByRole('combobox', { name: 'Version' }),
      '2',
    );

    expect(step()?.config).toMatchObject({
      prompt: { pin: { kind: PromptVersionKind.Pinned, number: 2 } },
    });
  });
});
