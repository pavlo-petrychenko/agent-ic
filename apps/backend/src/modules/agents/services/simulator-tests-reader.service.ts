export abstract class SimulatorTestsReader {
  abstract lastTestedAt(
    workspaceId: string,
    agentId: string,
    draftRevision: number,
  ): Promise<Date | null>;
}
