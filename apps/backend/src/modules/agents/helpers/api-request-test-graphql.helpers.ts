import type { ApiRequestTestResult } from '@/modules/agents/typedefs/api-request-test.typedefs';
import type { ApiRequestTestResult as GraphqlApiRequestTestResult } from '@/platform/graphql-server/generated/schema.generated';
import { ApiRequestTestOutcome } from '@/platform/graphql-server/generated/schema.generated';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';

const GRAPHQL_TEST_OUTCOME: Readonly<Record<OutboundHttpOutcome, ApiRequestTestOutcome>> = {
  [OutboundHttpOutcome.Responded]: ApiRequestTestOutcome.Responded,
  [OutboundHttpOutcome.TimedOut]: ApiRequestTestOutcome.TimedOut,
  [OutboundHttpOutcome.Unreachable]: ApiRequestTestOutcome.Unreachable,
  [OutboundHttpOutcome.BlockedAddress]: ApiRequestTestOutcome.BlockedAddress,
  [OutboundHttpOutcome.InvalidUrl]: ApiRequestTestOutcome.InvalidUrl,
};

export const toGraphqlApiRequestTestResult = (
  result: ApiRequestTestResult,
): GraphqlApiRequestTestResult => ({
  outcome: GRAPHQL_TEST_OUTCOME[result.outcome],
  status: result.status,
  body: result.body,
  bodyTruncated: result.bodyTruncated,
  durationMs: result.durationMs,
});
