export const CREATE_AGENT_MUTATION =
  'mutation { createAgent(input: { name: "Simulated" }) { id } }';

export const startSimulationMutation = (agentId: string): string =>
  `mutation { startSimulation(input: { agentId: "${agentId}", channelKind: simulated }) { conversation { id state } } }`;

export const simulatorQuery = (agentId: string): string =>
  `{ simulation(agentId: "${agentId}") { messages { id } runs { id } } agent(id: "${agentId}") { lastSimulationRun { id } } }`;
