import { z } from 'zod';
import { LLM_OUTPUT_NOT_JSON } from '@/platform/llm/constants/llm-gateway.constants';

export const jsonTextSchema = z.string().transform((text, context): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    context.addIssue({ code: 'custom', message: LLM_OUTPUT_NOT_JSON });
    return z.NEVER;
  }
});
