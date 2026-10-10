export abstract class SimulatorTestsReader {
  abstract lastTestedAt(
    workspaceId: string,
    draftVersionId: string,
    revision: number,
  ): Promise<Date | null>;
}
