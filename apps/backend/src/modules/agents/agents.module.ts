import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class AgentsModule extends defineModule({
  providers: [AgentsRepository, AgentVersionsRepository],
}) {}
