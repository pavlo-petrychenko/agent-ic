import type {
  AssistantContent,
  ModelMessage,
  TextPart,
  ToolCallPart,
  ToolContent,
  ToolResultPart,
} from 'ai';
import { LLM_REPLY_TOOL_NAME } from '@/platform/llm/constants/llm-gateway.constants';
import {
  LLM_REPLAYED_CALL_ID_DIGITS,
  LLM_REPLAYED_CALL_ID_PREFIX,
  LLM_REPLAYED_TOOL_CALL_LABEL,
  LLM_REPLAYED_TOOL_RESULT_LABEL,
} from '@/platform/llm/constants/llm-transcript.constants';
import type {
  LlmReplay,
  LlmTranscriptMessage,
} from '@/platform/llm/typedefs/llm-transcript.typedefs';

type ReplayedIds = ReadonlyMap<string, string>;

export const replayedCallId = (index: number): string =>
  `${LLM_REPLAYED_CALL_ID_PREFIX}${String(index).padStart(LLM_REPLAYED_CALL_ID_DIGITS, '0')}`;

const resultIdsOf = (transcript: readonly LlmTranscriptMessage[]): ReadonlySet<string> =>
  new Set(
    transcript.flatMap((message) =>
      message.role === 'tool'
        ? message.content.flatMap((part) => (part.type === 'tool-result' ? [part.toolCallId] : []))
        : [],
    ),
  );

const toolCallsOf = (transcript: readonly LlmTranscriptMessage[]): ToolCallPart[] =>
  transcript.flatMap((message) =>
    message.role === 'assistant' && typeof message.content !== 'string'
      ? message.content.flatMap((part) => (part.type === 'tool-call' ? [part] : []))
      : [],
  );

const replayedIdsOf = (
  transcript: readonly LlmTranscriptMessage[],
  toolNames: ReadonlySet<string>,
  firstIndex: number,
): ReplayedIds => {
  const results = resultIdsOf(transcript);
  const ids = new Map<string, string>();
  for (const call of toolCallsOf(transcript)) {
    const pairs =
      call.providerExecuted !== true &&
      toolNames.has(call.toolName) &&
      results.has(call.toolCallId) &&
      !ids.has(call.toolCallId);
    if (pairs) {
      ids.set(call.toolCallId, replayedCallId(firstIndex + ids.size));
    }
  }
  return ids;
};

const valueText = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

export const toolOutputText = (output: ToolResultPart['output']): string =>
  'value' in output ? valueText(output.value) : JSON.stringify(output);

export const toolCallText = ({ toolName, input }: ToolCallPart): string =>
  toolName === LLM_REPLY_TOOL_NAME
    ? JSON.stringify(input)
    : `${LLM_REPLAYED_TOOL_CALL_LABEL} ${toolName}: ${JSON.stringify(input)}`;

export const toolResultText = ({ toolName, output }: ToolResultPart): string =>
  `${LLM_REPLAYED_TOOL_RESULT_LABEL} ${toolName}: ${toolOutputText(output)}`;

const replayAssistant = (content: AssistantContent, ids: ReplayedIds): ModelMessage[] => {
  if (typeof content === 'string') {
    return [{ role: 'assistant', content }];
  }
  const parts = content.flatMap((part): (TextPart | ToolCallPart)[] => {
    if (part.type === 'text') {
      return [{ type: 'text', text: part.text }];
    }
    if (part.type !== 'tool-call') {
      return [];
    }
    const toolCallId = ids.get(part.toolCallId);
    return toolCallId === undefined
      ? [{ type: 'text', text: toolCallText(part) }]
      : [{ type: 'tool-call', toolCallId, toolName: part.toolName, input: part.input }];
  });
  return parts.length === 0 ? [] : [{ role: 'assistant', content: parts }];
};

const replayTool = (content: ToolContent, ids: ReplayedIds): ModelMessage[] => {
  const results = content.flatMap((part) => (part.type === 'tool-result' ? [part] : []));
  const paired = results.flatMap((part): ToolResultPart[] => {
    const toolCallId = ids.get(part.toolCallId);
    return toolCallId === undefined
      ? []
      : [{ type: 'tool-result', toolCallId, toolName: part.toolName, output: part.output }];
  });
  const unpaired = results
    .filter((part) => !ids.has(part.toolCallId))
    .map((part): TextPart => ({ type: 'text', text: toolResultText(part) }));
  return [
    ...(paired.length === 0 ? [] : [{ role: 'tool' as const, content: paired }]),
    ...(unpaired.length === 0 ? [] : [{ role: 'assistant' as const, content: unpaired }]),
  ];
};

const replayMessage = (message: LlmTranscriptMessage, ids: ReplayedIds): ModelMessage[] => {
  if (message.role === 'assistant') {
    return replayAssistant(message.content, ids);
  }
  if (message.role === 'tool') {
    return replayTool(message.content, ids);
  }
  return message.role === 'user'
    ? [{ role: 'user', content: message.content }]
    : [{ role: 'system', content: message.content }];
};

export const replayTranscript = (
  transcript: readonly LlmTranscriptMessage[],
  toolNames: ReadonlySet<string>,
  firstIndex: number,
): LlmReplay => {
  const ids = replayedIdsOf(transcript, toolNames, firstIndex);
  return {
    messages: transcript.flatMap((message) => replayMessage(message, ids)),
    nextIndex: firstIndex + ids.size,
  };
};
