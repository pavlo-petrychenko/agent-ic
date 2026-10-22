import { MAX_TEMPLATE_LENGTH } from '@agent-ic/flow';
import { z } from 'zod';
import { PromptField } from '@/modules/prompts/constants/prompt-input.constants';
import {
  PROMPT_TEST_CUSTOMER_MESSAGE_MAX_LENGTH,
  PROMPT_TEST_SAMPLE_VALUE_MAX_LENGTH,
  PROMPT_TEST_VARIABLES_MAX,
} from '@/modules/prompts/constants/prompt-test.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';

const testPromptTextSchema = z.string().trim().min(1).max(MAX_TEMPLATE_LENGTH);
const testCustomerMessageSchema = z
  .string()
  .trim()
  .min(1)
  .max(PROMPT_TEST_CUSTOMER_MESSAGE_MAX_LENGTH);
const testVariableNameSchema = z.string().trim().min(1);
const testVariableValueSchema = z.string().max(PROMPT_TEST_SAMPLE_VALUE_MAX_LENGTH);
const testVersionNumberSchema = z.int().min(1).nullish();

export const testPromptVariableSchema = z.object({
  name: testVariableNameSchema,
  value: testVariableValueSchema,
});

export const testPromptInputSchema = z.object({
  [PromptField.PromptId]: z.string().min(1),
  [PromptField.Text]: testPromptTextSchema,
  [PromptField.VersionNumber]: testVersionNumberSchema,
  [PromptField.Variables]: z.array(testPromptVariableSchema).max(PROMPT_TEST_VARIABLES_MAX),
  [PromptField.CustomerMessage]: testCustomerMessageSchema,
  [PromptField.Model]: z.enum(LlmModelId),
});

export const testPromptOutputSchema = z.object({
  messages: z.array(z.string()),
});
