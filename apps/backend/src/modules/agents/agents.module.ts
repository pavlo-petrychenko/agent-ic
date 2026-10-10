import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentRuntimeReader } from '@/modules/agents/services/agent-runtime-reader.service';
import { CreateAgentUseCase } from '@/modules/agents/use-cases/create-agent.use-case';
import { RenameAgentUseCase } from '@/modules/agents/use-cases/rename-agent.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class AgentsModule extends defineModule({
  providers: [
    AgentsRepository,
    AgentVersionsRepository,
    AgentFlowService,
    AgentPublishingService,
    AgentRuntimeReader,
    CreateAgentUseCase,
    RenameAgentUseCase,
  ],
  exports: [AgentRuntimeReader],
}) {}
