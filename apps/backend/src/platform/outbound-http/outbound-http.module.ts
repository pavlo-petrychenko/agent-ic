import { Global, Module } from '@nestjs/common';
import {
  BLOCKED_ADDRESS_RANGES,
  OUTBOUND_BLOCKED_RANGES,
} from '@/platform/outbound-http/constants/outbound-http.constants';
import { NodeOutboundHttpGateway } from '@/platform/outbound-http/gateways/node-outbound-http.gateway';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';

@Global()
@Module({
  providers: [
    { provide: OUTBOUND_BLOCKED_RANGES, useValue: BLOCKED_ADDRESS_RANGES },
    { provide: OutboundHttpGateway, useClass: NodeOutboundHttpGateway },
  ],
  exports: [OutboundHttpGateway],
})
export class OutboundHttpModule {}
