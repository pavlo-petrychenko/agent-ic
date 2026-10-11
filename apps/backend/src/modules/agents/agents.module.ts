import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentsResolver } from '@/modules/agents/resolvers/agents.resolver';
import { CreateAgentResolver } from '@/modules/agents/resolvers/create-agent.resolver';
import { DeleteAgentResolver } from '@/modules/agents/resolvers/delete-agent.resolver';
import { DescribeAgentResolver } from '@/modules/agents/resolvers/describe-agent.resolver';
import { DuplicateAgentResolver } from '@/modules/agents/resolvers/duplicate-agent.resolver';
import { PauseAgentResolver } from '@/modules/agents/resolvers/pause-agent.resolver';
import { PublishAgentResolver } from '@/modules/agents/resolvers/publish-agent.resolver';
import { RenameAgentResolver } from '@/modules/agents/resolvers/rename-agent.resolver';
import { RestoreAgentVersionResolver } from '@/modules/agents/resolvers/restore-agent-version.resolver';
import { ResumeAgentResolver } from '@/modules/agents/resolvers/resume-agent.resolver';
import { SaveAgentDraftResolver } from '@/modules/agents/resolvers/save-agent-draft.resolver';
import { AgentDraftsService } from '@/modules/agents/services/agent-drafts.service';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentRuntimeReader } from '@/modules/agents/services/agent-runtime-reader.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import { CompareAgentVersionsUseCase } from '@/modules/agents/use-cases/compare-agent-versions.use-case';
import { CreateAgentUseCase } from '@/modules/agents/use-cases/create-agent.use-case';
import { DeleteAgentUseCase } from '@/modules/agents/use-cases/delete-agent.use-case';
import { DescribeAgentUseCase } from '@/modules/agents/use-cases/describe-agent.use-case';
import { DuplicateAgentUseCase } from '@/modules/agents/use-cases/duplicate-agent.use-case';
import { GetAgentDraftUseCase } from '@/modules/agents/use-cases/get-agent-draft.use-case';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { ListAgentVersionsUseCase } from '@/modules/agents/use-cases/list-agent-versions.use-case';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
import { PauseAgentUseCase } from '@/modules/agents/use-cases/pause-agent.use-case';
import { PreviewAgentPublishUseCase } from '@/modules/agents/use-cases/preview-agent-publish.use-case';
import { PublishAgentUseCase } from '@/modules/agents/use-cases/publish-agent.use-case';
import { RenameAgentUseCase } from '@/modules/agents/use-cases/rename-agent.use-case';
import { RestoreAgentVersionUseCase } from '@/modules/agents/use-cases/restore-agent-version.use-case';
import { ResumeAgentUseCase } from '@/modules/agents/use-cases/resume-agent.use-case';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class AgentsModule extends defineModule({
  providers: [
    AgentsRepository,
    AgentVersionsRepository,
    AgentDraftsService,
    AgentFlowService,
    AgentPublishingService,
    AgentRuntimeReader,
    AgentViewsService,
    CreateAgentUseCase,
    RenameAgentUseCase,
    DescribeAgentUseCase,
    DeleteAgentUseCase,
    ListAgentsUseCase,
    GetAgentUseCase,
    GetAgentDraftUseCase,
    SaveAgentDraftUseCase,
    PublishAgentUseCase,
    DuplicateAgentUseCase,
    ListAgentVersionsUseCase,
    PauseAgentUseCase,
    ResumeAgentUseCase,
    CompareAgentVersionsUseCase,
    PreviewAgentPublishUseCase,
    RestoreAgentVersionUseCase,
  ],
  resolvers: [
    CreateAgentResolver,
    RenameAgentResolver,
    DescribeAgentResolver,
    DeleteAgentResolver,
    AgentsResolver,
    SaveAgentDraftResolver,
    PublishAgentResolver,
    DuplicateAgentResolver,
    PauseAgentResolver,
    ResumeAgentResolver,
    RestoreAgentVersionResolver,
  ],
  exports: [AgentRuntimeReader],
}) {}
