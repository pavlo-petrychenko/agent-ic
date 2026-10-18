import { NodeType, PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { FlowDocument, PromptSource } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  inlineStepPrompts,
  withLibraryStepPrompts,
} from '@/modules/prompts/helpers/inline-prompt.helpers';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  agentNode,
  completionNode,
  flowEdge,
  stepFlow,
  triggerOnlyFlow,
} from '@test/support/fixtures/runs.fixture';

const AGENT_NODE_ID = 'n_answer';
const AGENT_NODE_LABEL = 'Answer';
const COMPLETION_NODE_ID = 'n_sort';
const COMPLETION_NODE_LABEL = 'Sort the message';
const LIBRARY_NODE_ID = 'n_summary';
const AGENT_PROMPT_TEXT = 'Answer the customer briefly.';
const COMPLETION_PROMPT_TEXT = 'Sort the message into a category.';
const EXISTING_PROMPT_REF = 'prm_existing';
const IMPORTED_PROMPT_REF = 'prm_imported';
const OTHER_IMPORTED_PROMPT_REF = 'prm_imported_other';

const inline = (text: string): PromptSource => ({ kind: PromptSourceKind.Inline, text });

const library = (promptRef: string): PromptSource => ({
  kind: PromptSourceKind.Library,
  promptRef,
  pin: { kind: PromptVersionKind.Latest },
});

const labelled = <TNode extends { label: string }>(node: TNode, label: string): TNode => ({
  ...node,
  label,
});

const flow = (): FlowDocument =>
  stepFlow(
    [
      labelled(
        agentNode(AGENT_NODE_ID, 'answer', { prompt: inline(AGENT_PROMPT_TEXT) }),
        AGENT_NODE_LABEL,
      ),
      labelled(
        completionNode(COMPLETION_NODE_ID, 'sort', { prompt: inline(COMPLETION_PROMPT_TEXT) }),
        COMPLETION_NODE_LABEL,
      ),
      agentNode(LIBRARY_NODE_ID, 'summary', { prompt: library(EXISTING_PROMPT_REF) }),
    ],
    [flowEdge(TEST_NODE_ID, AGENT_NODE_ID)],
  );

const nodePrompt = (document: FlowDocument, nodeId: string): PromptSource | null => {
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  return node !== undefined && (node.type === NodeType.Agent || node.type === NodeType.Completion)
    ? node.config.prompt
    : null;
};

describe('inlineStepPrompts', () => {
  it('collects the prompt written in each agent and completion step', () => {
    expect(inlineStepPrompts(flow())).toEqual([
      { nodeId: AGENT_NODE_ID, nodeLabel: AGENT_NODE_LABEL, text: AGENT_PROMPT_TEXT },
      {
        nodeId: COMPLETION_NODE_ID,
        nodeLabel: COMPLETION_NODE_LABEL,
        text: COMPLETION_PROMPT_TEXT,
      },
    ]);
  });

  it('answers nothing when every step already uses a library prompt', () => {
    expect(inlineStepPrompts(triggerOnlyFlow())).toEqual([]);
    expect(
      inlineStepPrompts(
        stepFlow(
          [agentNode(LIBRARY_NODE_ID, 'summary', { prompt: library(EXISTING_PROMPT_REF) })],
          [],
        ),
      ),
    ).toEqual([]);
  });
});

describe('withLibraryStepPrompts', () => {
  it('points only the rewritten steps at their imported prompt', () => {
    const rewritten = withLibraryStepPrompts(
      flow(),
      new Map([
        [AGENT_NODE_ID, IMPORTED_PROMPT_REF],
        [COMPLETION_NODE_ID, OTHER_IMPORTED_PROMPT_REF],
      ]),
    );

    expect(nodePrompt(rewritten, AGENT_NODE_ID)).toEqual(library(IMPORTED_PROMPT_REF));
    expect(nodePrompt(rewritten, COMPLETION_NODE_ID)).toEqual(library(OTHER_IMPORTED_PROMPT_REF));
    expect(nodePrompt(rewritten, LIBRARY_NODE_ID)).toEqual(library(EXISTING_PROMPT_REF));
  });

  it('keeps the rest of the document untouched', () => {
    const before = flow();

    const rewritten = withLibraryStepPrompts(
      before,
      new Map([[AGENT_NODE_ID, IMPORTED_PROMPT_REF]]),
    );

    expect(rewritten.schemaVersion).toBe(before.schemaVersion);
    expect(rewritten.edges).toEqual(before.edges);
    expect(rewritten.nodes.filter((node) => node.id !== AGENT_NODE_ID)).toEqual(
      before.nodes.filter((node) => node.id !== AGENT_NODE_ID),
    );
    expect(rewritten.nodes.find((node) => node.id === AGENT_NODE_ID)?.label).toBe(AGENT_NODE_LABEL);
  });
});
