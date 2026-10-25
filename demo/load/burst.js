import { fail, sleep } from 'k6';
import exec from 'k6/execution';
import { chatTurn, duplicateAgent, listAgents, newChat, prepare } from './lib.js';

const BURST_VUS = Number(__ENV.BURST_VUS || 20);
const BURST_DURATION = __ENV.BURST_DURATION || '2m';
const SOURCE_AGENT_NAME = 'FAQ assistant';
const BURST_AGENT_PREFIX = 'Burst agent';
const PAUSE_SECONDS = 1;

export const options = {
  scenarios: {
    burst: {
      executor: 'ramping-vus',
      exec: 'burst',
      startVUs: 1,
      stages: [
        { duration: '20s', target: BURST_VUS },
        { duration: BURST_DURATION, target: BURST_VUS },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  summaryTrendStats: ['avg', 'p(95)', 'max'],
};

const burstAgentName = (index) => `${BURST_AGENT_PREFIX} ${index + 1}`;

export function setup() {
  const prepared = prepare();
  const agents = listAgents(prepared.session);
  const source = agents.find((agent) => agent.name === SOURCE_AGENT_NAME);
  if (!source) {
    fail(`agent "${SOURCE_AGENT_NAME}" not found; did the seed run?`);
  }
  const burstAgents = Array.from({ length: BURST_VUS }, (_, index) => {
    const name = burstAgentName(index);
    const existing = agents.find((agent) => agent.name === name);
    if (existing) {
      return { id: existing.id, versionId: null };
    }
    return { id: duplicateAgent(prepared.session, source.id, name), versionId: null };
  });
  return { session: prepared.session, burstAgents };
}

let conversation = null;

export function burst(prepared) {
  if (conversation === null) {
    conversation = newChat(
      prepared.burstAgents[(exec.vu.idInTest - 1) % prepared.burstAgents.length],
    );
  }
  chatTurn(prepared.session, conversation);
  sleep(PAUSE_SECONDS);
}
