import { sleep } from 'k6';
import exec from 'k6/execution';
import { CHAT_AGENTS, chatTurn, editTurn, newChat, prepare } from './lib.js';

const DURATION = __ENV.LOAD_RUN_DURATION || '12m';
const LOAD_RATE = Number(__ENV.LOAD_RATE || 1.5);
const CHAT_VUS = CHAT_AGENTS.length;
const SECONDS_PER_TURN = CHAT_VUS / LOAD_RATE;

export const options = {
  scenarios: {
    chats: {
      executor: 'constant-vus',
      exec: 'chat',
      vus: CHAT_VUS,
      duration: DURATION,
      gracefulStop: '15s',
    },
    edits: {
      executor: 'constant-arrival-rate',
      exec: 'edit',
      rate: 3,
      timeUnit: '1m',
      duration: DURATION,
      preAllocatedVUs: 1,
      maxVUs: 2,
    },
  },
  summaryTrendStats: ['avg', 'p(95)', 'max'],
};

export function setup() {
  return prepare();
}

let conversation = null;

export function chat(prepared) {
  if (prepared.chatAgents.length === 0) {
    sleep(SECONDS_PER_TURN);
    return;
  }
  if (conversation === null) {
    conversation = newChat(
      prepared.chatAgents[exec.scenario.iterationInTest % prepared.chatAgents.length],
    );
  }
  const started = Date.now();
  chatTurn(prepared.session, conversation);
  sleep(Math.max(0.5, SECONDS_PER_TURN - (Date.now() - started) / 1000));
}

export function edit(prepared) {
  editTurn(prepared.session, prepared);
}
