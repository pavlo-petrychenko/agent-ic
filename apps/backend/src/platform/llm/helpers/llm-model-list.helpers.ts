import { LlmKeyVendor } from '@agent-ic/contracts';
import { HttpMethod } from '@agent-ic/flow';
import { HttpStatus } from '@nestjs/common';
import type { DomainError } from '@/platform/errors/errors/domain.error';
import {
  LLM_BEARER_PREFIX,
  LLM_CUSTOM_MODELS_PATH,
  LLM_GOOGLE_CHAT_METHOD,
  LLM_GOOGLE_MODEL_NAME_PREFIX,
  LLM_MODEL_ID_EXCLUDED_FRAGMENTS,
  LLM_MODEL_LIST_TIMEOUT_MS,
  LLM_URL_TRAILING_SLASHES,
  LLM_VENDOR_ENDPOINTS,
  LlmEndpointAuth,
  LlmEndpointHeader,
} from '@/platform/llm/constants/llm-vendor-endpoint.constants';
import { LlmKeyEndpointBlockedError } from '@/platform/llm/errors/llm-key-endpoint-blocked.error';
import { LlmKeyInvalidError } from '@/platform/llm/errors/llm-key-invalid.error';
import { LlmKeyUnreachableError } from '@/platform/llm/errors/llm-key-unreachable.error';
import {
  dataModelListSchema,
  googleModelListSchema,
} from '@/platform/llm/schemas/llm-model-list.schema';
import { jsonTextSchema } from '@/platform/llm/schemas/llm-output.schema';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import type {
  OutboundHttpRequest,
  OutboundHttpResult,
} from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

const REJECTED_KEY_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
]);

const authHeaders = (auth: LlmEndpointAuth, apiKey: string): Record<string, string> => {
  switch (auth) {
    case LlmEndpointAuth.Bearer:
      return { [LlmEndpointHeader.Authorization]: `${LLM_BEARER_PREFIX}${apiKey}` };
    case LlmEndpointAuth.XApiKey:
      return { [LlmEndpointHeader.XApiKey]: apiKey };
    case LlmEndpointAuth.GoogApiKey:
      return { [LlmEndpointHeader.GoogApiKey]: apiKey };
  }
};

const getRequest = (url: string, headers: Record<string, string>): OutboundHttpRequest => ({
  method: HttpMethod.Get,
  url,
  headers,
  body: null,
  timeoutMs: LLM_MODEL_LIST_TIMEOUT_MS,
});

export const modelListRequest = ({
  vendor,
  baseUrl,
  apiKey,
}: LlmWorkspaceKey): OutboundHttpRequest | null => {
  if (vendor === LlmKeyVendor.Custom) {
    return baseUrl === null
      ? null
      : getRequest(
          `${baseUrl.replace(LLM_URL_TRAILING_SLASHES, '')}${LLM_CUSTOM_MODELS_PATH}`,
          authHeaders(LlmEndpointAuth.Bearer, apiKey),
        );
  }
  const endpoint = LLM_VENDOR_ENDPOINTS[vendor];
  return getRequest(`${endpoint.baseUrl}${endpoint.modelsPath}`, {
    ...endpoint.headers,
    ...authHeaders(endpoint.auth, apiKey),
  });
};

export const modelListFailure = (
  vendor: LlmKeyVendor,
  { outcome, status }: OutboundHttpResult,
): DomainError | null => {
  switch (outcome) {
    case OutboundHttpOutcome.Responded:
      if (status !== null && REJECTED_KEY_STATUSES.has(status)) {
        return new LlmKeyInvalidError(vendor, status);
      }
      return status !== null && status >= HttpStatus.OK && status < HttpStatus.AMBIGUOUS
        ? null
        : new LlmKeyUnreachableError(vendor, outcome, status);
    case OutboundHttpOutcome.InvalidRequest:
      return new LlmKeyInvalidError(vendor, status);
    case OutboundHttpOutcome.BlockedAddress:
    case OutboundHttpOutcome.InvalidUrl:
      return new LlmKeyEndpointBlockedError(vendor);
    case OutboundHttpOutcome.TimedOut:
    case OutboundHttpOutcome.Unreachable:
      return new LlmKeyUnreachableError(vendor, outcome, status);
  }
};

export const listedModelIds = (vendor: LlmKeyVendor, body: string): readonly string[] | null => {
  if (vendor === LlmKeyVendor.Google) {
    const parsed = jsonTextSchema.pipe(googleModelListSchema).safeParse(body);
    return parsed.success
      ? parsed.data.models
          .filter(({ supportedGenerationMethods }) =>
            supportedGenerationMethods.includes(LLM_GOOGLE_CHAT_METHOD),
          )
          .map(({ name }) =>
            name.startsWith(LLM_GOOGLE_MODEL_NAME_PREFIX)
              ? name.slice(LLM_GOOGLE_MODEL_NAME_PREFIX.length)
              : name,
          )
      : null;
  }
  const parsed = jsonTextSchema.pipe(dataModelListSchema).safeParse(body);
  return parsed.success ? parsed.data.data.map(({ id }) => id) : null;
};

export const chatModelIds = (ids: readonly string[]): readonly string[] =>
  [
    ...new Set(
      ids.filter(
        (id) =>
          !LLM_MODEL_ID_EXCLUDED_FRAGMENTS.some((fragment) => id.toLowerCase().includes(fragment)),
      ),
    ),
  ].sort();
