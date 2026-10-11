import { FailureMode, NodeType, PortName, RequestAuthKind } from '@agent-ic/flow';
import type { ApiRequestNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { toOutboundRequest } from '@/modules/agents';
import { ApiRequestAuthUnsupportedError } from '@/modules/runs/errors/api-request-auth-unsupported.error';
import { ApiRequestFailedError } from '@/modules/runs/errors/api-request-failed.error';
import {
  apiRequestBackoffMs,
  apiRequestOutput,
  isApiRequestOk,
  isRetryableApiResult,
} from '@/modules/runs/helpers/api-request.helpers';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import type {
  OutboundHttpRequest,
  OutboundHttpResult,
} from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

@Injectable()
export class ApiRequestExecutor implements StepExecutor<ApiRequestNode> {
  readonly nodeType = NodeType.ApiRequest;

  constructor(
    private readonly http: OutboundHttpGateway,
    private readonly clock: ClockService,
  ) {}

  async execute({
    node,
    scope,
  }: Pick<StepExecution<ApiRequestNode>, 'node' | 'scope'>): Promise<StepOutcome> {
    const { auth, retries, onFailure } = node.config;
    if (auth.kind !== RequestAuthKind.None) {
      throw new ApiRequestAuthUnsupportedError(node.id);
    }
    const result = await this.send(toOutboundRequest(node, scope.variables), retries);
    if (!isApiRequestOk(result) && onFailure === FailureMode.ErrorPort) {
      throw new ApiRequestFailedError(node.id, result);
    }
    return { port: PortName.Next, output: apiRequestOutput(result) };
  }

  private async send(request: OutboundHttpRequest, retries: number): Promise<OutboundHttpResult> {
    let result = await this.http.send(request);
    for (let retry = 1; retry <= retries && isRetryableApiResult(result); retry += 1) {
      await this.clock.sleep(apiRequestBackoffMs(retry));
      result = await this.http.send(request);
    }
    return result;
  }
}
