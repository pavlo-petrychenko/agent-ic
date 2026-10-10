import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentsResolver } from '@/modules/agents/resolvers/agents.resolver';
import { CreateAgentResolver } from '@/modules/agents/resolvers/create-agent.resolver';
import { DeleteAgentResolver } from '@/modules/agents/resolvers/delete-agent.resolver';
import { RenameAgentResolver } from '@/modules/agents/resolvers/rename-agent.resolver';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentRuntimeReader } from '@/modules/agents/services/agent-runtime-reader.service';
import { CreateAgentUseCase } from '@/modules/agents/use-cases/create-agent.use-case';
import { DeleteAgentUseCase } from '@/modules/agents/use-cases/delete-agent.use-case';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
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
    DeleteAgentUseCase,
    ListAgentsUseCase,
    GetAgentUseCase,
  ],
  resolvers: [CreateAgentResolver, RenameAgentResolver, DeleteAgentResolver, AgentsResolver],
  exports: [AgentRuntimeReader],
}) {}
