import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader, SimulatorTestsReader } from '@/modules/agents';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';

@Injectable()
export class SimulationTestsReaderService extends SimulatorTestsReader {
  constructor(
    private readonly agents: AgentRuntimeReader,
    private readonly runs: RunsRepository,
  ) {
    super();
  }

  async lastTestedAt(
    workspaceId: string,
    agentId: string,
    draftRevision: number,
  ): Promise<Date | null> {
    const snapshotIds = await this.agents.listSnapshotIds(workspaceId, agentId, draftRevision);
    const run = await this.runs.findLatestFinishedOnVersions(workspaceId, agentId, snapshotIds);
    return run?.finishedAt ?? null;
  }
}
