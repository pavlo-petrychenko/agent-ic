import { lookup } from 'node:dns';
import type { LookupAddress, LookupOptions } from 'node:dns';
import { request as httpRequest } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { BlockList } from 'node:net';
import { Inject, Injectable } from '@nestjs/common';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  OUTBOUND_BLOCKED_RANGES,
  OUTBOUND_BODY_ENCODING,
  OUTBOUND_RESPONSE_MAX_BYTES,
  OutboundHttpOutcome,
  OutboundProtocol,
} from '@/platform/outbound-http/constants/outbound-http.constants';
import { OutboundAddressBlockedError } from '@/platform/outbound-http/errors/outbound-address-blocked.error';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import {
  hostAddressOf,
  isBlockedAddress,
  parseOutboundUrl,
  toBlockList,
} from '@/platform/outbound-http/helpers/outbound-address.helpers';
import type {
  OutboundAddressRange,
  OutboundHttpRequest,
  OutboundHttpResult,
} from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

@Injectable()
export class NodeOutboundHttpGateway extends OutboundHttpGateway {
  private readonly blockList: BlockList;

  constructor(
    private readonly clock: ClockService,
    @Inject(OUTBOUND_BLOCKED_RANGES) ranges: readonly OutboundAddressRange[],
  ) {
    super();
    this.blockList = toBlockList(ranges);
  }

  async send(request: OutboundHttpRequest): Promise<OutboundHttpResult> {
    const startedAt = this.clock.now().getTime();
    const finish = (
      outcome: OutboundHttpOutcome,
      response: Pick<OutboundHttpResult, 'status' | 'body' | 'bodyTruncated'> | null = null,
    ): OutboundHttpResult => ({
      outcome,
      status: response?.status ?? null,
      body: response?.body ?? null,
      bodyTruncated: response?.bodyTruncated ?? false,
      durationMs: this.clock.now().getTime() - startedAt,
    });
    const url = parseOutboundUrl(request.url);
    if (url === null) {
      return finish(OutboundHttpOutcome.InvalidUrl);
    }
    const address = hostAddressOf(url);
    if (address !== null && isBlockedAddress(this.blockList, address)) {
      return finish(OutboundHttpOutcome.BlockedAddress);
    }
    const signal = AbortSignal.timeout(request.timeoutMs);
    return new Promise((resolve) => {
      const send = url.protocol === OutboundProtocol.Https ? httpsRequest : httpRequest;
      const outgoing = send(
        url,
        {
          method: request.method,
          headers: request.headers,
          signal,
          lookup: (hostname, options, callback) => this.lookup(hostname, options, callback),
        },
        (response) => {
          void this.readBody(response).then(
            (body) => resolve(finish(OutboundHttpOutcome.Responded, body)),
            () => resolve(finish(this.failureOutcome(signal, null))),
          );
        },
      );
      outgoing.on('error', (error) => resolve(finish(this.failureOutcome(signal, error))));
      outgoing.end(request.body ?? undefined);
    });
  }

  private lookup(hostname: string, options: LookupOptions, callback: LookupCallback): void {
    lookup(hostname, { ...options, all: true }, (error, addresses) => {
      if (error !== null) {
        callback(error, []);
        return;
      }
      if (addresses.some(({ address }) => isBlockedAddress(this.blockList, address))) {
        callback(new OutboundAddressBlockedError(), []);
        return;
      }
      const [first] = addresses;
      if (options.all === true || first === undefined) {
        callback(null, addresses);
        return;
      }
      callback(null, first.address, first.family);
    });
  }

  private async readBody(
    response: IncomingMessage,
  ): Promise<Pick<OutboundHttpResult, 'status' | 'body' | 'bodyTruncated'>> {
    const chunks: Buffer[] = [];
    let size = 0;
    let bodyTruncated = false;
    for await (const chunk of response) {
      const buffer = Buffer.from(chunk);
      chunks.push(buffer.subarray(0, OUTBOUND_RESPONSE_MAX_BYTES - size));
      size = Math.min(size + buffer.length, OUTBOUND_RESPONSE_MAX_BYTES);
      if (size >= OUTBOUND_RESPONSE_MAX_BYTES) {
        bodyTruncated = true;
        response.destroy();
        break;
      }
    }
    return {
      status: response.statusCode ?? null,
      body: Buffer.concat(chunks).toString(OUTBOUND_BODY_ENCODING),
      bodyTruncated,
    };
  }

  private failureOutcome(signal: AbortSignal, error: Error | null): OutboundHttpOutcome {
    if (signal.aborted) {
      return OutboundHttpOutcome.TimedOut;
    }
    return error instanceof OutboundAddressBlockedError
      ? OutboundHttpOutcome.BlockedAddress
      : OutboundHttpOutcome.Unreachable;
  }
}
