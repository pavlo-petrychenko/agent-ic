import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { API_REQUEST_TEST_RATE_LIMIT } from '@/modules/agents/constants/api-request-test.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { ApiRequestStepNotFoundError } from '@/modules/agents/errors/api-request-step-not-found.error';
import { parseAgentInput } from '@/modules/agents/helpers/agent-input.helpers';
import {
  findApiRequestNode,
  toOutboundRequest,
} from '@/modules/agents/helpers/api-request-test.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { testApiRequestInputSchema } from '@/modules/agents/schemas/agent-input.schema';
import type {
  ApiRequestTestResult,
  TestApiRequestInput,
} from '@/modules/agents/typedefs/api-request-test.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class TestApiRequestUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly versions: AgentVersionsRepository,
    private readonly http: OutboundHttpGateway,
    private readonly ids: IdService,
    private readonly rateLimits: RateLimitService,
  ) {}

  async execute(ctx: UseCaseCtx, input: TestApiRequestInput): Promise<ApiRequestTestResult> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.Edit);
    await this.rateLimits.enforce(API_REQUEST_TEST_RATE_LIMIT, workspaceId);
    const {
      agentId: publicId,
      nodeId,
      variables,
    } = parseAgentInput(testApiRequestInputSchema, input);
    const agentId = this.ids.fromPublic(IdPrefix.Agent, publicId);
    const draft = await this.tenantTransactions.run(workspaceId, () =>
      this.versions.findDraft(workspaceId, agentId),
    );
    if (draft === null) {
      throw new AgentNotFoundError();
    }
    const node = findApiRequestNode(draft.flow, nodeId);
    if (node === null) {
      throw new ApiRequestStepNotFoundError();
    }
    return this.http.send(toOutboundRequest(node, variables));
  }
}
