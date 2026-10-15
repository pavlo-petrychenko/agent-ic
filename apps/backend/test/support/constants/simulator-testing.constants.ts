export const CREATE_AGENT_MUTATION =
  'mutation { createAgent(input: { name: "Simulated" }) { id } }';

export const startSimulationMutation = (agentId: string): string =>
  `mutation { startSimulation(input: { agentId: "${agentId}", channelKind: simulated }) { conversation { id state } } }`;

export const simulatorQuery = (agentId: string): string =>
  `{ simulation(agentId: "${agentId}") { messages { id } runs { id } } agent(id: "${agentId}") { lastSimulationRun { id } } }`;

export const simulationRunsQuery = (agentId: string): string =>
  `{ simulation(agentId: "${agentId}") { runs { id steps { id } totals { stepsRun } } } }`;

export const AGENT_FIELDS_QUERY =
  '{ agents { edges { node { id draftChangeCount lastSimulationRun { id } } } } }';

export const publishAgentMutation = (agentId: string): string =>
  `mutation { publishAgent(input: { id: "${agentId}" }) { agent { id draftChangeCount } } }`;

export const SIMULATION_RUN_STEP_COUNTS: readonly number[] = [2, 0, 1];

export const SIMULATOR_TEST_TEXT = 'Do you deliver on Sundays?';

export const sendSimulatorMessageMutation = (conversationId: string): string =>
  `mutation { sendSimulatorMessage(input: { conversationId: "${conversationId}", text: "${SIMULATOR_TEST_TEXT}" }) { author runId } }`;

export const replyAsOperatorMutation = (conversationId: string): string =>
  `mutation { replyAsOperator(input: { conversationId: "${conversationId}", text: "${SIMULATOR_TEST_TEXT}" }) { author runId } }`;

export const handBackMutation = (conversationId: string): string =>
  `mutation { handBack(input: { conversationId: "${conversationId}" }) { state } }`;

export const restartSimulationMutation = (agentId: string): string =>
  `mutation { restartSimulation(input: { agentId: "${agentId}" }) { conversation { id state } } }`;
