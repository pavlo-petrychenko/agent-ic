import { WorkspaceRole } from '@agent-ic/contracts';
import { HttpMethod, RequestBodyKind } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  API_REQUEST_CONTENT_TYPE,
  CONTENT_TYPE_HEADER,
} from '@/modules/agents/constants/api-request-test.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { ApiRequestStepNotFoundError } from '@/modules/agents/errors/api-request-step-not-found.error';
import { TestApiRequestUseCase } from '@/modules/agents/use-cases/test-api-request.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import type { OutboundHttpResult } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';
import {
  TEST_API_HEADER_NAME,
  TEST_API_HEADER_TEMPLATE,
  TEST_API_NODE_ID,
  TEST_API_TIMEOUT_SECONDS,
  TEST_API_URL_TEMPLATE,
  TEST_NODE_ID,
  TEST_ORDER_NUMBER,
} from '@test/support/constants/agents-testing.constants';
import {
  OUTBOUND_TEST_BODY,
  OUTBOUND_TEST_HOST,
  OUTBOUND_TEST_INVALID_HEADER_VALUES,
  OUTBOUND_TEST_STATUS,
} from '@test/support/constants/outbound-http-testing.constants';
import { apiRequestFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

const responded: OutboundHttpResult = {
  outcome: OutboundHttpOutcome.Responded,
  status: OUTBOUND_TEST_STATUS,
  body: OUTBOUND_TEST_BODY,
  bodyTruncated: false,
  durationMs: 0,
};

describe('TestApiRequestUseCase', () => {
  let testingModule: TestingModule;
  let testApiRequest: TestApiRequestUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    testApiRequest = testingModule.get(TestApiRequestUseCase);
    ids = testingModule.get(IdService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seed = async (url: string) => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId, apiRequestFlow(url));
    return { workspaceId, agentId: publicAgentId(testingModule, agentId) };
  };

  it('sends the draft step with the sample variables and returns the answer', async () => {
    const { workspaceId, agentId } = await seed(TEST_API_URL_TEMPLATE);
    const send = vi.spyOn(testingModule.get(OutboundHttpGateway), 'send');
    send.mockResolvedValue(responded);

    const result = await testApiRequest.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
      { agentId, nodeId: TEST_API_NODE_ID, variables: { message: { text: TEST_ORDER_NUMBER } } },
    );

    expect(result).toEqual(responded);
    expect(send).toHaveBeenCalledWith({
      method: HttpMethod.Post,
      url: TEST_API_URL_TEMPLATE.replace(TEST_API_HEADER_TEMPLATE, TEST_ORDER_NUMBER),
      headers: {
        [CONTENT_TYPE_HEADER]: API_REQUEST_CONTENT_TYPE[RequestBodyKind.Json],
        [TEST_API_HEADER_NAME.toLowerCase()]: TEST_ORDER_NUMBER,
      },
      body: JSON.stringify({ order: TEST_ORDER_NUMBER }),
      timeoutMs: TEST_API_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND,
    });
  });

  it('never calls a private address', async () => {
    const { workspaceId, agentId } = await seed(`http://${OUTBOUND_TEST_HOST}/`);

    const result = await testApiRequest.execute(agentsCtx(testingModule, workspaceId), {
      agentId,
      nodeId: TEST_API_NODE_ID,
    });

    expect(result.outcome).toBe(OutboundHttpOutcome.BlockedAddress);
  });

  it.each(OUTBOUND_TEST_INVALID_HEADER_VALUES)(
    'answers invalid_request when the header renders %j',
    async (text) => {
      const { workspaceId, agentId } = await seed(TEST_API_URL_TEMPLATE);

      const result = await testApiRequest.execute(agentsCtx(testingModule, workspaceId), {
        agentId,
        nodeId: TEST_API_NODE_ID,
        variables: { message: { text } },
      });

      expect(result).toMatchObject({ outcome: OutboundHttpOutcome.InvalidRequest, status: null });
    },
  );

  it('refuses a node that is not an API request step', async () => {
    const { workspaceId, agentId } = await seed(TEST_API_URL_TEMPLATE);

    const attempt = testApiRequest.execute(agentsCtx(testingModule, workspaceId), {
      agentId,
      nodeId: TEST_NODE_ID,
    });

    await expect(attempt).rejects.toBeInstanceOf(ApiRequestStepNotFoundError);
  });

  it('never reads the draft of another workspace', async () => {
    const { agentId } = await seed(TEST_API_URL_TEMPLATE);

    const attempt = testApiRequest.execute(agentsCtx(testingModule, ids.generate()), {
      agentId,
      nodeId: TEST_API_NODE_ID,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const { workspaceId, agentId } = await seed(TEST_API_URL_TEMPLATE);

    const attempt = testApiRequest.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { agentId, nodeId: TEST_API_NODE_ID },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
