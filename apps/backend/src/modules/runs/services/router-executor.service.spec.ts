import { PortName } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { RouterExecutor } from '@/modules/runs/services/router-executor.service';
import {
  FIRST_STEP_KEY,
  ROUTER_NODE_ID,
  ROUTER_NODE_KEY,
  RUNS_TEST_START,
  SECOND_STEP_KEY,
  TEST_ROUTE_RULE_ID,
} from '@test/support/constants/runs-testing.constants';
import { routerNode } from '@test/support/fixtures/runs.fixture';

const routeWith = (answer: string | null) =>
  new RouterExecutor().execute({
    node: routerNode(ROUTER_NODE_ID, ROUTER_NODE_KEY),
    scope: {
      variables: answer === null ? {} : { [FIRST_STEP_KEY]: { answer } },
      history: [],
      today: RUNS_TEST_START,
    },
  });

describe('RouterExecutor', () => {
  it('takes the port of the first rule that matches the variables', async () => {
    expect(await routeWith(FIRST_STEP_KEY)).toEqual({ port: TEST_ROUTE_RULE_ID, output: {} });
  });

  it('takes else when no rule matches or the variable is missing', async () => {
    expect((await routeWith(SECOND_STEP_KEY)).port).toBe(PortName.Else);
    expect((await routeWith(null)).port).toBe(PortName.Else);
  });
});
