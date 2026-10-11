import { NodeType } from '@agent-ic/flow';
import type { MockLink } from '@apollo/client/testing';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_AGENT_ID,
  DRAFT_REVISION,
  TRIGGER_ONLY_FLOW,
  buildFlowBuilderDraftMock,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import {
  CONFLICT_SAVED_AT,
  CONFLICT_SAVED_BY,
  buildSaveAgentDraftConflictMock,
  buildSaveAgentDraftFailureMock,
  buildSaveAgentDraftMock,
  buildSavedDraftResult,
} from '@/features/flow-builder/communication/fixtures/saveAgentDraft.fixture';
import { AUTOSAVE_DEBOUNCE_MS } from '@/features/flow-builder/constants/autosave.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { formatSavedAt } from '@/features/flow-builder/logic/helpers/autosave.helpers';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { workspaceHref } from '@/features/flow-builder/logic/helpers/route.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const builderPath = `/w/${DEMO_WORKSPACE.id}/agents/${DEMO_AGENT_ID}`;
const shell = buildWorkspaceShellMock([DEMO_WORKSPACE]);
const store = () => useFlowBuilderStore.getState();

const openBuilder = async (mocks: readonly MockLink.MockedResponse[], flow: unknown) => {
  const { history } = renderRoute(builderPath, {
    mocks: [shell, buildFlowBuilderDraftMock(flow), ...mocks],
  });
  const canvas = await screen.findByRole('region', { name: 'Flow canvas' });
  vi.useFakeTimers();
  return { canvas, history };
};

const addReply = () =>
  act(() => {
    const { document, apply } = store();
    apply(
      addNode(document, NodeType.SendMessage, { x: 0, y: 200 }, `reply_${document.nodes.length}`),
    );
  });

const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

const saveAfterDebounce = async () => {
  await wait(AUTOSAVE_DEBOUNCE_MS);
  await act(() => vi.runOnlyPendingTimersAsync());
};

describe('flow builder autosave', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    vi.useRealTimers();
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('saves once a second after the last edit and takes the new revision', async () => {
    await openBuilder([buildSaveAgentDraftMock(DRAFT_REVISION)], TRIGGER_ONLY_FLOW);

    addReply();
    await wait(AUTOSAVE_DEBOUNCE_MS - 1);
    addReply();
    await wait(AUTOSAVE_DEBOUNCE_MS - 1);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(store().revision).toBe(DRAFT_REVISION);

    await saveAfterDebounce();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(store().revision).toBe(DRAFT_REVISION + 1);
  });

  it('sends the edits made during a save when the user leaves', async () => {
    const sendQueued = vi.fn<
      (variables: Record<string, unknown>) => ReturnType<typeof buildSavedDraftResult>
    >(() => buildSavedDraftResult(DRAFT_REVISION + 1));
    const { history } = await openBuilder(
      [
        { ...buildSaveAgentDraftMock(DRAFT_REVISION), delay: AUTOSAVE_DEBOUNCE_MS },
        { ...buildSaveAgentDraftMock(DRAFT_REVISION + 1), result: sendQueued },
      ],
      TRIGGER_ONLY_FLOW,
    );

    addReply();
    await wait(AUTOSAVE_DEBOUNCE_MS);
    expect(store().saveState).toBe(SaveState.Saving);
    addReply();
    act(() => history.push(workspaceHref(DEMO_WORKSPACE.id)));
    await act(() => vi.runAllTimersAsync());

    expect(screen.queryByRole('region', { name: 'Flow canvas' })).toBeNull();
    expect(sendQueued).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ revision: DRAFT_REVISION + 1, flow: store().document }),
    );
    expect(store().document.nodes).toHaveLength(3);
  });

  it('shows who changed the draft and reloads it on a conflict', async () => {
    await openBuilder(
      [
        buildSaveAgentDraftConflictMock(DRAFT_REVISION),
        buildFlowBuilderDraftMock(TRIGGER_ONLY_FLOW, DRAFT_REVISION + 2),
      ],
      TRIGGER_ONLY_FLOW,
    );

    addReply();
    await saveAfterDebounce();
    const time = formatSavedAt(CONFLICT_SAVED_AT, 'en');
    expect(
      screen.getByText(`Changed by ${CONFLICT_SAVED_BY} at ${time}. Reload to continue.`),
    ).toBeInTheDocument();
    expect(screen.getByText('Not saved')).toBeInTheDocument();

    vi.useRealTimers();
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(store().revision).toBe(DRAFT_REVISION + 2);
    expect(store().history.past).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Reload' })).toBeNull();
  });

  it('keeps the edits when a save fails and saves them on retry', async () => {
    const { canvas } = await openBuilder(
      [buildSaveAgentDraftFailureMock(DRAFT_REVISION), buildSaveAgentDraftMock(DRAFT_REVISION)],
      TRIGGER_ONLY_FLOW,
    );

    addReply();
    await saveAfterDebounce();
    expect(screen.getByText('Couldn’t save')).toBeInTheDocument();
    expect(within(canvas).getByLabelText('send_message')).toBeInTheDocument();

    vi.useRealTimers();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(store().document.nodes).toHaveLength(2);
  });
});
