import { Global, Module } from '@nestjs/common';
import {
  BLOCKED_ADDRESS_RANGES,
  OUTBOUND_BLOCKED_RANGES,
  OUTBOUND_GUARDED_FETCH,
} from '@/platform/outbound-http/constants/outbound-http.constants';
import { NodeOutboundHttpGateway } from '@/platform/outbound-http/gateways/node-outbound-http.gateway';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import { guardedFetch } from '@/platform/outbound-http/helpers/guarded-fetch.helpers';
import { toBlockList } from '@/platform/outbound-http/helpers/outbound-address.helpers';
import type { OutboundAddressRange } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

@Global()
@Module({
  providers: [
    { provide: OUTBOUND_BLOCKED_RANGES, useValue: BLOCKED_ADDRESS_RANGES },
    { provide: OutboundHttpGateway, useClass: NodeOutboundHttpGateway },
    {
      provide: OUTBOUND_GUARDED_FETCH,
      useFactory: (ranges: readonly OutboundAddressRange[]) => guardedFetch(toBlockList(ranges)),
      inject: [OUTBOUND_BLOCKED_RANGES],
    },
  ],
  exports: [OutboundHttpGateway, OUTBOUND_GUARDED_FETCH],
})
export class OutboundHttpModule {}
