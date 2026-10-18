import type { SamplePromptKey } from '@/modules/agents/constants/sample-prompt.constants';

export interface SamplePromptDefinition {
  readonly name: string;
  readonly text: string;
}

export type SamplePromptRefs = Readonly<Record<SamplePromptKey, string>>;
