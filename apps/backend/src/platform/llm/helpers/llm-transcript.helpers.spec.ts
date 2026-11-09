import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { LLM_REPLY_TOOL_NAME } from '@/platform/llm/constants/llm-gateway.constants';
import { replayedCallId, replayTranscript } from '@/platform/llm/helpers/llm-transcript.helpers';

const SEARCH = 'search_menu';
const GONE = 'search_old_menu';
const SEARCH_INPUT = { query: 'vegan' };
const SEARCH_OUTPUT = { found: true, results: [{ text: 'Vegan pancakes' }] };
const ANSWER = { messages: ['We have vegan pancakes.'], outcome: 'continue' };
const PROVIDER_OPTIONS = { anthropic: { signature: 'sig' } };
const TOOLS = new Set([SEARCH]);
const FIRST_INDEX = 3;

const searchRound: ModelMessage[] = [
  {
    role: 'assistant',
    content: [
      { type: 'reasoning', text: 'I should search.', providerOptions: PROVIDER_OPTIONS },
      { type: 'text', text: 'Let me check.' },
      { type: 'tool-call', toolCallId: 'toolu_01AbC', toolName: SEARCH, input: SEARCH_INPUT },
      { type: 'tool-call', toolCallId: 'call_old', toolName: GONE, input: SEARCH_INPUT },
    ],
  },
  {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: 'toolu_01AbC',
        toolName: SEARCH,
        output: { type: 'json', value: SEARCH_OUTPUT },
      },
      {
        type: 'tool-result',
        toolCallId: 'call_old',
        toolName: GONE,
        output: { type: 'error-text', value: 'Down' },
      },
    ],
  },
];

describe('replayedCallId', () => {
  it('makes a nine character id of letters and digits that every provider accepts', () => {
    expect(replayedCallId(7)).toBe('call00007');
    expect(replayedCallId(7)).toMatch(/^[a-zA-Z0-9]{9}$/);
  });
});

describe('replayTranscript', () => {
  it('pairs an attached tool call with its result under a new id and drops reasoning', () => {
    const { messages, nextIndex } = replayTranscript(searchRound, TOOLS, FIRST_INDEX);

    expect(messages).toEqual([
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me check.' },
          {
            type: 'tool-call',
            toolCallId: replayedCallId(FIRST_INDEX),
            toolName: SEARCH,
            input: SEARCH_INPUT,
          },
          { type: 'text', text: `Tool call ${GONE}: ${JSON.stringify(SEARCH_INPUT)}` },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: replayedCallId(FIRST_INDEX),
            toolName: SEARCH,
            output: { type: 'json', value: SEARCH_OUTPUT },
          },
        ],
      },
      { role: 'assistant', content: [{ type: 'text', text: `Tool result ${GONE}: Down` }] },
    ]);
    expect(nextIndex).toBe(FIRST_INDEX + 1);
  });

  it('keeps a final answer of the reply tool as its JSON, since it has no result', () => {
    const reply: ModelMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: 'r1', toolName: LLM_REPLY_TOOL_NAME, input: ANSWER },
        ],
      },
    ];

    expect(replayTranscript(reply, new Set([SEARCH, LLM_REPLY_TOOL_NAME]), 0).messages).toEqual([
      { role: 'assistant', content: [{ type: 'text', text: JSON.stringify(ANSWER) }] },
    ]);
  });

  it('keeps a final message and the feedback the agent got in the turn', () => {
    const final: ModelMessage[] = [
      { role: 'assistant', content: [{ type: 'text', text: '{"messages":[]}' }] },
      { role: 'user', content: 'Your answer does not match the schema.' },
      { role: 'assistant', content: JSON.stringify(ANSWER) },
    ];

    expect(replayTranscript(final, TOOLS, 0)).toEqual({ messages: final, nextIndex: 0 });
  });

  it('turns a tool call without a result into text', () => {
    const [assistant] = searchRound;
    if (assistant === undefined) {
      throw new Error('missing round');
    }

    expect(replayTranscript([assistant], TOOLS, 0).messages).toEqual([
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me check.' },
          { type: 'text', text: `Tool call ${SEARCH}: ${JSON.stringify(SEARCH_INPUT)}` },
          { type: 'text', text: `Tool call ${GONE}: ${JSON.stringify(SEARCH_INPUT)}` },
        ],
      },
    ]);
  });
});
