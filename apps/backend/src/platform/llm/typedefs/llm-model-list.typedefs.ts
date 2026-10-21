import type { LlmKeyVendor } from '@agent-ic/contracts';
import type { LlmEndpointAuth } from '@/platform/llm/constants/llm-vendor-endpoint.constants';

export type LlmKnownKeyVendor = Exclude<LlmKeyVendor, LlmKeyVendor.Custom>;

export interface LlmVendorEndpoint {
  readonly baseUrl: string;
  readonly modelsPath: string;
  readonly auth: LlmEndpointAuth;
  readonly headers: Readonly<Record<string, string>>;
}
