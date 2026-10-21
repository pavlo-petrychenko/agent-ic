import { FlowIssueCode, FlowIssueSeverity } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LlmKeyFlowReferenceChecker } from '@/modules/llm-keys/services/llm-key-flow-reference-checker.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_UNKNOWN_LLM_KEY_ID } from '@test/support/constants/llm-keys-testing.constants';
import { agentOnKey, agentOnPlatform, keyModelFlow } from '@test/support/fixtures/llm-keys.fixture';
import {
  createLlmKeysTestingModule,
  publicLlmKeyId,
  seedLlmKey,
  seedLlmKeyAuthor,
} from '@test/support/helpers/llm-keys-testing.helpers';

const KEPT_NODE_ID = 'n_kept';
const REMOVED_NODE_ID = 'n_removed';
const MALFORMED_NODE_ID = 'n_malformed';
const PLATFORM_NODE_ID = 'n_platform';

const missingKeyIssue = (nodeId: string): FlowIssue => ({
  code: FlowIssueCode.MissingProviderKey,
  severity: FlowIssueSeverity.Error,
  nodeId,
  edgeId: null,
  path: ['model'],
  params: {},
});

describe('LlmKeyFlowReferenceChecker', () => {
  let testingModule: TestingModule;
  let checker: LlmKeyFlowReferenceChecker;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let authorId: string;

  beforeAll(async () => {
    testingModule = await createLlmKeysTestingModule();
    checker = testingModule.get(LlmKeyFlowReferenceChecker);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    authorId = await seedLlmKeyAuthor(testingModule);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('flags every step whose key is gone', async () => {
    const workspaceId = ids.generate();
    const keyId = await seedLlmKey(testingModule, workspaceId, authorId);
    const flow = keyModelFlow([
      agentOnKey(KEPT_NODE_ID, publicLlmKeyId(testingModule, keyId)),
      agentOnKey(REMOVED_NODE_ID, publicLlmKeyId(testingModule, ids.generate())),
      agentOnKey(MALFORMED_NODE_ID, TEST_UNKNOWN_LLM_KEY_ID),
      agentOnPlatform(PLATFORM_NODE_ID),
    ]);

    const issues = await tenants.run(workspaceId, () => checker.check(workspaceId, flow));

    expect(issues).toEqual([missingKeyIssue(REMOVED_NODE_ID), missingKeyIssue(MALFORMED_NODE_ID)]);
  });

  it('does not accept a key of another workspace', async () => {
    const workspaceId = ids.generate();
    const keyId = await seedLlmKey(testingModule, ids.generate(), authorId);
    const flow = keyModelFlow([agentOnKey(KEPT_NODE_ID, publicLlmKeyId(testingModule, keyId))]);

    const issues = await tenants.run(workspaceId, () => checker.check(workspaceId, flow));

    expect(issues).toEqual([missingKeyIssue(KEPT_NODE_ID)]);
  });

  it('finds nothing in a flow on platform models', async () => {
    const workspaceId = ids.generate();
    const flow = keyModelFlow([agentOnPlatform(PLATFORM_NODE_ID)]);

    await expect(tenants.run(workspaceId, () => checker.check(workspaceId, flow))).resolves.toEqual(
      [],
    );
  });
});
