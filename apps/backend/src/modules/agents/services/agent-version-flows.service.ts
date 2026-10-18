import type { FlowDocument } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import type { AgentVersionFlow } from '@/modules/agents/typedefs/agent-version-flow.typedefs';

@Injectable()
export class AgentVersionFlowsService {
  constructor(private readonly versions: AgentVersionsRepository) {}

  listAll(workspaceId: string): Promise<readonly AgentVersionFlow[]> {
    return this.versions.listAllFlows(workspaceId);
  }

  async replaceFlow(
    workspaceId: string,
    versionId: string,
    flow: FlowDocument,
    updatedAt: Date,
  ): Promise<void> {
    const updated = await this.versions.replaceFlow(workspaceId, versionId, flow, updatedAt);
    if (!updated) {
      throw new AgentVersionNotFoundError();
    }
  }
}
