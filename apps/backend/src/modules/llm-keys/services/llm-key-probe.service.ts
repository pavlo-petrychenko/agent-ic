import { LlmKeyVendor } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { LLM_KEY_PROBE_ID } from '@/modules/llm-keys/constants/llm-key.constants';
import type { LlmKeyProbeInput } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { LlmKeyEndpointBlockedError } from '@/platform/llm/errors/llm-key-endpoint-blocked.error';
import { LlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.gateway';
import { OutboundProtocol } from '@/platform/outbound-http/constants/outbound-http.constants';
import { parseOutboundUrl } from '@/platform/outbound-http/helpers/outbound-address.helpers';

@Injectable()
export class LlmKeyProbeService {
  constructor(private readonly models: LlmModelListGateway) {}

  probe(input: LlmKeyProbeInput): Promise<readonly string[]> {
    if (input.vendor === LlmKeyVendor.Custom) {
      this.assertHttpsEndpoint(input);
    }
    return this.models.list({
      id: LLM_KEY_PROBE_ID,
      vendor: input.vendor,
      baseUrl: input.vendor === LlmKeyVendor.Custom ? input.baseUrl : null,
      apiKey: input.apiKey,
      fallbackToPlatform: false,
    });
  }

  private assertHttpsEndpoint({ vendor, baseUrl }: LlmKeyProbeInput): void {
    const url = baseUrl === null ? null : parseOutboundUrl(baseUrl);
    if (url === null || url.protocol !== OutboundProtocol.Https) {
      throw new LlmKeyEndpointBlockedError(vendor);
    }
  }
}
