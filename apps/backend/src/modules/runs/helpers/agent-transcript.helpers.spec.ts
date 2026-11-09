import { describe, expect, it } from 'vitest';
import { MessageAuthor } from '@/modules/conversations';
import {
  earlierRunIds,
  sentTextsOf,
  stepTraceColumns,
  transcriptsByRun,
} from '@/modules/runs/helpers/agent-transcript.helpers';
import { IdService } from '@/platform/ids/services/id.service';
import { RUNS_TEST_START } from '@test/support/constants/runs-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { historyMessage, runConversation } from '@test/support/fixtures/runs.fixture';

const NODE = 'node-agent';
const OTHER_NODE = 'node-other';
const RUN = 'run-1';
const OTHER_RUN = 'run-2';
const CURRENT_RUN = 'run-3';
const first = [{ role: 'assistant' as const, content: 'first' }];
const second = [{ role: 'assistant' as const, content: 'second' }];

describe('earlierRunIds', () => {
  const conversation = runConversation(new IdService(new ManualClock(RUNS_TEST_START)));
  const sent = (runId: string | null) => ({
    ...historyMessage(conversation, MessageAuthor.Agent, String(runId)),
    runId,
  });

  it('lists each earlier run once, without the current run', () => {
    expect(
      earlierRunIds(
        [sent(RUN), sent(null), sent(RUN), sent(OTHER_RUN), sent(CURRENT_RUN)],
        CURRENT_RUN,
      ),
    ).toEqual([RUN, OTHER_RUN]);
  });
});

describe('sentTextsOf', () => {
  it('reads the messages the agent wrote', () => {
    expect(sentTextsOf({ messages: ['Hi', 3, 'Bye'] })).toEqual(['Hi', 'Bye']);
    expect(sentTextsOf(null)).toEqual([]);
  });
});

describe('transcriptsByRun', () => {
  it('joins the transcripts of one node per run in step order', () => {
    const byRun = transcriptsByRun(
      [
        { runId: RUN, nodeId: NODE, transcript: first, output: { messages: ['a'] } },
        { runId: RUN, nodeId: OTHER_NODE, transcript: second, output: null },
        { runId: RUN, nodeId: NODE, transcript: second, output: { messages: ['b'] } },
      ],
      NODE,
    );

    expect(byRun.get(RUN)).toEqual({
      transcript: [...first, ...second],
      sentTexts: new Set(['a', 'b']),
    });
    expect(byRun.has(OTHER_RUN)).toBe(false);
  });
});

describe('stepTraceColumns', () => {
  it('stores nothing for a step without a trace', () => {
    expect(stepTraceColumns(null)).toEqual({ toolCalls: null, transcript: null });
  });
});
