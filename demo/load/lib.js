import { check, fail, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Counter } from 'k6/metrics';

export const BASE_URL = __ENV.BASE_URL || 'http://web:8080';
export const ORIGIN = __ENV.ORIGIN || 'http://localhost:8080';
export const DEMO_EMAIL = 'demo@local.agent-ic.pavlop.dev';
export const DEMO_PASSWORD = 'demo-password-2026';
export const WORKSPACE_NAME = 'Flow examples';
export const PROMPT_FOLDER_NAME = 'Café';
export const LOAD_PROMPT_NAME = 'Load test notes';
export const LOAD_AGENT_NAME = 'Load test scratch';
export const CHAT_AGENTS = [
  'FAQ assistant',
  'Intent router',
  'Complaint check in parallel',
  'Reply and score',
  'Table booking',
  'Menu buttons',
];
export const QUESTIONS = [
  'What are your opening hours on Sunday?',
  'Do you deliver on Sundays?',
  'Do you have oat milk?',
  'Can I book a table for four tonight at 19:00?',
  'What desserts do you have today?',
  'Where are you located?',
  'What is the Wi-Fi password?',
  'How much is a cappuccino?',
  'My coffee was cold, I want to complain.',
  'Do you have vegan options?',
  'Can I pay by card?',
  'Is there parking nearby?',
];
export const LOAD_COPY_PREFIX = 'Load ·';
const MAX_TURNS_PER_CONVERSATION = 10;
const REPLY_POLL_SECONDS = 0.5;
const REPLY_POLL_ATTEMPTS = 40;
const AGENT_ACTIVE = 'agent_active';

const chatReply = new Trend('chat_reply_seconds', true);
const chatMessages = new Counter('chat_messages');

const json = (body) => JSON.stringify(body);

export function login() {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    json({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
    {
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      tags: { name: 'login' },
    },
  );
  if (!check(response, { 'login succeeded': (r) => r.status === 200 })) {
    fail(`login failed with ${response.status}: ${response.body}`);
  }
  return response.json('accessToken');
}

export function gql(session, name, query, variables) {
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${session.token}` };
  if (session.workspaceId) {
    headers['x-workspace-id'] = session.workspaceId;
  }
  const response = http.post(
    `${BASE_URL}/api/graphql`,
    json({ query, variables: variables || {} }),
    {
      headers,
      tags: { name },
    },
  );
  const body = response.status === 200 ? response.json() : null;
  const ok = check(response, { [`${name} succeeded`]: () => body !== null && !body.errors });
  return ok ? body.data : null;
}

const findOrCreatePrompt = (session) => {
  const data = gql(session, 'promptFolders', '{ promptFolders { id name } prompts { id name } }');
  const folder =
    data.promptFolders.find((candidate) => candidate.name === PROMPT_FOLDER_NAME) ||
    data.promptFolders[0];
  const existing = data.prompts.find((candidate) => candidate.name === LOAD_PROMPT_NAME);
  if (existing) {
    return existing.id;
  }
  const created = gql(
    session,
    'createPrompt',
    'mutation ($input: CreatePromptInput!) { createPrompt(input: $input) { id } }',
    {
      input: { name: LOAD_PROMPT_NAME, folderId: folder.id },
    },
  );
  return created.createPrompt.id;
};

const findOrCreateAgent = (session, agents) => {
  const existing = agents.find((agent) => agent.name === LOAD_AGENT_NAME);
  if (existing) {
    return existing.id;
  }
  const created = gql(
    session,
    'createAgent',
    'mutation ($input: CreateAgentInput!) { createAgent(input: $input) { id } }',
    {
      input: { name: LOAD_AGENT_NAME },
    },
  );
  return created.createAgent.id;
};

export function listAgents(session) {
  const data = gql(session, 'agents', '{ agents(first: 100) { edges { node { id name } } } }');
  return data.agents.edges.map((edge) => edge.node);
}

export function duplicateAgent(session, sourceId, name) {
  const copy = gql(
    session,
    'duplicateAgent',
    'mutation ($input: DuplicateAgentInput!) { duplicateAgent(input: $input) { id } }',
    {
      input: { id: sourceId },
    },
  );
  gql(
    session,
    'renameAgent',
    'mutation ($input: RenameAgentInput!) { renameAgent(input: $input) { id } }',
    {
      input: { id: copy.duplicateAgent.id, name },
    },
  );
  return copy.duplicateAgent.id;
}

const loadCopy = (session, agents, source) => {
  const name = `${LOAD_COPY_PREFIX} ${source.name}`;
  const existing = agents.find((agent) => agent.name === name);
  if (existing) {
    return { id: existing.id, name, versionId: liveVersion(session, existing.id) };
  }
  const id = duplicateAgent(session, source.id, name);
  const published = gql(
    session,
    'publishAgent',
    'mutation ($input: PublishAgentInput!) { publishAgent(input: $input) { version { id } } }',
    {
      input: { id, note: 'Published by the k6 load test' },
    },
  );
  return { id, name, versionId: published ? published.publishAgent.version.id : null };
};

export function prepare() {
  const token = login();
  const me = gql(
    { token, workspaceId: null },
    'myWorkspaces',
    '{ myWorkspaces { workspace { id name } } }',
  );
  const membership = me.myWorkspaces.find(
    (candidate) => candidate.workspace.name === WORKSPACE_NAME,
  );
  if (!membership) {
    fail(`workspace "${WORKSPACE_NAME}" not found; did the seed run?`);
  }
  const session = { token, workspaceId: membership.workspace.id };
  const agents = listAgents(session);
  const sources = CHAT_AGENTS.map((name) => agents.find((agent) => agent.name === name)).filter(
    Boolean,
  );
  return {
    session,
    chatAgents: sources.map((source) => loadCopy(session, agents, source)),
    promptId: findOrCreatePrompt(session),
    scratchAgentId: findOrCreateAgent(session, agents),
  };
}

export function liveVersion(session, agentId) {
  const data = gql(
    session,
    'agentVersions',
    'query ($id: ID!) { agentVersions(agentId: $id) { id status } }',
    { id: agentId },
  );
  const live = data ? data.agentVersions.find((version) => version.status === 'live') : null;
  return live ? live.id : null;
}

const agentReplies = (simulation) =>
  simulation.messages.filter((message) => message.author === 'agent').length;

const SIMULATION_FIELDS = 'conversation { id state } messages { author }';

const startConversation = (session, chat) => {
  const restart = chat.conversationId !== null;
  const data = restart
    ? gql(
        session,
        'restartSimulation',
        `mutation ($input: RestartSimulationInput!) { restartSimulation(input: $input) { ${SIMULATION_FIELDS} } }`,
        {
          input: { agentId: chat.agentId },
        },
      )
    : gql(
        session,
        'startSimulation',
        `mutation ($input: StartSimulationInput!) { startSimulation(input: $input) { ${SIMULATION_FIELDS} } }`,
        {
          input: { agentId: chat.agentId, versionId: chat.versionId, channelKind: 'simulated' },
        },
      );
  const simulation = data ? data.restartSimulation || data.startSimulation : null;
  chat.conversationId = simulation ? simulation.conversation.id : null;
  chat.replies = simulation ? agentReplies(simulation) : 0;
  chat.turns = 0;
};

export function newChat(agent) {
  return {
    agentId: agent.id,
    versionId: agent.versionId,
    conversationId: null,
    replies: 0,
    turns: 0,
  };
}

export function chatTurn(session, chat) {
  if (chat.conversationId === null || chat.turns >= MAX_TURNS_PER_CONVERSATION) {
    startConversation(session, chat);
    if (chat.conversationId === null) {
      return;
    }
  }
  const text = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const sent = gql(
    session,
    'sendSimulatorMessage',
    'mutation ($input: SendSimulatorMessageInput!) { sendSimulatorMessage(input: $input) { id } }',
    {
      input: { conversationId: chat.conversationId, text },
    },
  );
  chat.turns += 1;
  if (!sent) {
    chat.turns = MAX_TURNS_PER_CONVERSATION;
    return;
  }
  chatMessages.add(1);
  const started = Date.now();
  const before = chat.replies;
  for (let attempt = 0; attempt < REPLY_POLL_ATTEMPTS; attempt += 1) {
    sleep(REPLY_POLL_SECONDS);
    const data = gql(
      session,
      'simulation',
      `query ($agentId: ID!) { simulation(agentId: $agentId) { ${SIMULATION_FIELDS} } }`,
      {
        agentId: chat.agentId,
      },
    );
    const simulation = data ? data.simulation : null;
    if (!simulation) {
      return;
    }
    const replies = agentReplies(simulation);
    if (simulation.conversation.state !== AGENT_ACTIVE) {
      chat.turns = MAX_TURNS_PER_CONVERSATION;
    }
    if (replies > before) {
      chatReply.add(Date.now() - started);
      chat.replies = replies;
      return;
    }
    if (simulation.conversation.state !== AGENT_ACTIVE) {
      return;
    }
  }
}

export function editTurn(session, prepared) {
  const stamp = new Date().toISOString();
  gql(
    session,
    'savePromptVersion',
    'mutation ($input: SavePromptVersionInput!) { savePromptVersion(input: $input) { latestVersion { id } } }',
    {
      input: {
        id: prepared.promptId,
        text: `Answer like a friendly barista. Load test note saved at ${stamp}.`,
        note: `k6 ${stamp}`,
      },
    },
  );
  gql(
    session,
    'describeAgent',
    'mutation ($input: DescribeAgentInput!) { describeAgent(input: $input) { id } }',
    {
      input: { id: prepared.scratchAgentId, description: `Edited by the k6 load test at ${stamp}` },
    },
  );
}
