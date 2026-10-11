import { Injectable } from '@nestjs/common';
import { AgentRuntimeReader } from '@/modules/agents';
import { ConversationRunsService } from '@/modules/conversations';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunViewsService } from '@/modules/runs/services/run-views.service';
import type { RunView } from '@/modules/runs/typedefs/run-details.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';

@Injectable()
export class RunDetailsService {
  constructor(
    private readonly steps: RunStepsRepository,
    private readonly agents: AgentRuntimeReader,
    private readonly conversations: ConversationRunsService,
    private readonly views: RunViewsService,
  ) {}

  async details(run: Run): Promise<RunView> {
    const { workspaceId, id } = run;
    const steps = await this.steps.listByRun(workspaceId, id);
    const version = await this.agents.getVersion(workspaceId, run.versionId);
    return this.views.runView(run, steps, {
      stepsRun: steps.length,
      stepsInFlow: version.flow.nodes.length,
      messagesSent: await this.conversations.countRunMessages(workspaceId, id),
    });
  }
}
