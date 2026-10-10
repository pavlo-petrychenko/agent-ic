import { jsonSchema, tool, zodSchema } from 'ai';
import type { ModelMessage, Tool, ToolModelMessage, ToolSet } from 'ai';
import { z } from 'zod';
import {
  LLM_REPLY_INVALID_FEEDBACK,
  LLM_REPLY_TOOL_DESCRIPTION,
  LLM_REPLY_TOOL_NAME,
} from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmMessage, LlmTools } from '@/platform/llm/typedefs/llm-gateway.typedefs';

export const toModelMessages = (messages: readonly LlmMessage[]): ModelMessage[] =>
  messages.map(({ role, content }) => ({ role, content }));

export const replyTool = (schema: z.ZodType): Tool =>
  tool({
    description: LLM_REPLY_TOOL_DESCRIPTION,
    inputSchema: jsonSchema(zodSchema(schema).jsonSchema),
  });

export const toToolSet = (tools: LlmTools, schema: z.ZodType): ToolSet => ({
  ...Object.fromEntries(
    Object.entries(tools).map(([name, { description, inputSchema, execute }]) => [
      name,
      tool({ description, inputSchema, execute }),
    ]),
  ),
  [LLM_REPLY_TOOL_NAME]: replyTool(schema),
});

export const invalidReplyMessage = (toolCallId: string, error: z.ZodError): ToolModelMessage => ({
  role: 'tool',
  content: [
    {
      type: 'tool-result',
      toolCallId,
      toolName: LLM_REPLY_TOOL_NAME,
      output: {
        type: 'error-text',
        value: `${LLM_REPLY_INVALID_FEEDBACK}\n${z.prettifyError(error)}`,
      },
    },
  ],
});
