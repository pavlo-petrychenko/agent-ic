import { Injectable } from '@nestjs/common';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import type { CurrentAgentFlow } from '@/modules/agents/typedefs/current-agent-flow.typedefs';

@Injectable()
export class CurrentAgentFlowsReader {
  constructor(private readonly versions: AgentVersionsRepository) {}

  listCurrent(workspaceId: string): Promise<readonly CurrentAgentFlow[]> {
    return this.versions.listCurrentFlows(workspaceId);
  }
}
