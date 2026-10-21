import type { LlmKeyVendor } from '@agent-ic/contracts';
import type { z } from 'zod';
import type { llmKeys } from '@/modules/llm-keys/db/llm-keys.table';
import type {
  addLlmKeyInputSchema,
  checkLlmKeyInputSchema,
} from '@/modules/llm-keys/schemas/llm-key-input.schema';

export interface LlmKey {
  readonly id: string;
  readonly workspaceId: string;
  readonly vendor: LlmKeyVendor;
  readonly name: string;
  readonly baseUrl: string | null;
  readonly sealedKey: string;
  readonly keyLast4: string;
  readonly fallbackToPlatform: boolean;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type NewLlmKey = typeof llmKeys.$inferInsert;

export interface LlmKeyView {
  readonly id: string;
  readonly vendor: LlmKeyVendor;
  readonly name: string;
  readonly baseUrl: string | null;
  readonly keyLast4: string;
  readonly fallbackToPlatform: boolean;
  readonly addedBy: string;
  readonly createdAt: Date;
  readonly usedBySteps: number;
}

export interface LlmKeyOption {
  readonly id: string;
  readonly vendor: LlmKeyVendor;
  readonly name: string;
}

export interface LlmKeyCheck {
  readonly models: readonly string[];
}

export interface LlmKeyProbeInput {
  readonly vendor: LlmKeyVendor;
  readonly apiKey: string;
  readonly baseUrl: string | null;
}

export interface CheckLlmKeyInput {
  readonly vendor: string;
  readonly apiKey: string;
  readonly baseUrl?: string | null;
}

export interface AddLlmKeyInput {
  readonly vendor: string;
  readonly apiKey: string;
  readonly name?: string | null;
  readonly baseUrl?: string | null;
  readonly fallbackToPlatform: boolean;
}

export interface NewLlmKeyFields {
  readonly vendor: LlmKeyVendor;
  readonly apiKey: string;
  readonly name: string;
  readonly baseUrl: string | null;
  readonly fallbackToPlatform: boolean;
}

export interface SetLlmKeyFallbackInput {
  readonly id: string;
  readonly enabled: boolean;
}

export interface LlmKeyIdInput {
  readonly id: string;
}

export type ParsedCheckLlmKeyInput = z.infer<typeof checkLlmKeyInputSchema>;

export type ParsedAddLlmKeyInput = z.infer<typeof addLlmKeyInputSchema>;
