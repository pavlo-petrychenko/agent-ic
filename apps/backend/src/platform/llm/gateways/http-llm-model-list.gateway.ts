import { Injectable } from '@nestjs/common';
import { LlmKeyEndpointBlockedError } from '@/platform/llm/errors/llm-key-endpoint-blocked.error';
import { LlmKeyUnreachableError } from '@/platform/llm/errors/llm-key-unreachable.error';
import { LlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.gateway';
import {
  chatModelIds,
  listedModelIds,
  modelListFailure,
  modelListRequest,
} from '@/platform/llm/helpers/llm-model-list.helpers';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';

@Injectable()
export class HttpLlmModelListGateway extends LlmModelListGateway {
  constructor(private readonly http: OutboundHttpGateway) {
    super();
  }

  async list(key: LlmWorkspaceKey): Promise<readonly string[]> {
    const request = modelListRequest(key);
    if (request === null) {
      throw new LlmKeyEndpointBlockedError(key.vendor);
    }
    const result = await this.http.send(request);
    const failure = modelListFailure(key.vendor, result);
    if (failure !== null) {
      throw failure;
    }
    const ids = result.bodyTruncated ? null : listedModelIds(key.vendor, result.body ?? '');
    if (ids === null) {
      throw new LlmKeyUnreachableError(key.vendor, result.outcome, result.status);
    }
    return chatModelIds(ids);
  }
}
