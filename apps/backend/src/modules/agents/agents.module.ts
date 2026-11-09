import { DiscoveryModule } from '@nestjs/core';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AutoCloseVersionsRepository } from '@/modules/agents/repositories/auto-close-versions.repository';
import { LiveScheduleTriggersRepository } from '@/modules/agents/repositories/live-schedule-triggers.repository';
import { AgentFieldsResolver } from '@/modules/agents/resolvers/agent-fields.resolver';
import { AgentTemplatesResolver } from '@/modules/agents/resolvers/agent-templates.resolver';
import { AgentsResolver } from '@/modules/agents/resolvers/agents.resolver';
import { CreateAgentFromTemplateResolver } from '@/modules/agents/resolvers/create-agent-from-template.resolver';
import { CreateAgentResolver } from '@/modules/agents/resolvers/create-agent.resolver';
import { DeleteAgentResolver } from '@/modules/agents/resolvers/delete-agent.resolver';
import { DescribeAgentResolver } from '@/modules/agents/resolvers/describe-agent.resolver';
import { DuplicateAgentResolver } from '@/modules/agents/resolvers/duplicate-agent.resolver';
import { InboxFilterOptionsFieldsResolver } from '@/modules/agents/resolvers/inbox-filter-options-fields.resolver';
import { ModelOptionsResolver } from '@/modules/agents/resolvers/model-options.resolver';
import { PauseAgentResolver } from '@/modules/agents/resolvers/pause-agent.resolver';
import { PublishAgentResolver } from '@/modules/agents/resolvers/publish-agent.resolver';
import { RenameAgentResolver } from '@/modules/agents/resolvers/rename-agent.resolver';
import { RestoreAgentVersionResolver } from '@/modules/agents/resolvers/restore-agent-version.resolver';
import { ResumeAgentResolver } from '@/modules/agents/resolvers/resume-agent.resolver';
import { RollbackAgentResolver } from '@/modules/agents/resolvers/rollback-agent.resolver';
import { SaveAgentDraftResolver } from '@/modules/agents/resolvers/save-agent-draft.resolver';
import { TestApiRequestResolver } from '@/modules/agents/resolvers/test-api-request.resolver';
import { AgentDraftsService } from '@/modules/agents/services/agent-drafts.service';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentRuntimeReader } from '@/modules/agents/services/agent-runtime-reader.service';
import { AgentTemplatesService } from '@/modules/agents/services/agent-templates.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import { FlowReferenceChecksService } from '@/modules/agents/services/flow-reference-checks.service';
import { SampleAgentService } from '@/modules/agents/services/sample-agent.service';
import { ScheduleTriggerDirectoryService } from '@/modules/agents/services/schedule-trigger-directory.service';
import { SimulatorTestsService } from '@/modules/agents/services/simulator-tests.service';
import { TemplateKnowledgeBasesService } from '@/modules/agents/services/template-knowledge-bases.service';
import { TemplatePromptsService } from '@/modules/agents/services/template-prompts.service';
import { CompareAgentVersionsUseCase } from '@/modules/agents/use-cases/compare-agent-versions.use-case';
import { CountAgentsUseCase } from '@/modules/agents/use-cases/count-agents.use-case';
import { CountDraftChangesUseCase } from '@/modules/agents/use-cases/count-draft-changes.use-case';
import { CreateAgentFromTemplateUseCase } from '@/modules/agents/use-cases/create-agent-from-template.use-case';
import { CreateAgentUseCase } from '@/modules/agents/use-cases/create-agent.use-case';
import { DeleteAgentUseCase } from '@/modules/agents/use-cases/delete-agent.use-case';
import { DescribeAgentUseCase } from '@/modules/agents/use-cases/describe-agent.use-case';
import { DuplicateAgentUseCase } from '@/modules/agents/use-cases/duplicate-agent.use-case';
import { GetAgentDraftUseCase } from '@/modules/agents/use-cases/get-agent-draft.use-case';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { GetInboxAgentOptionsUseCase } from '@/modules/agents/use-cases/get-inbox-agent-options.use-case';
import { ListAgentTemplatesUseCase } from '@/modules/agents/use-cases/list-agent-templates.use-case';
import { ListAgentVersionsUseCase } from '@/modules/agents/use-cases/list-agent-versions.use-case';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
import { ListModelOptionsUseCase } from '@/modules/agents/use-cases/list-model-options.use-case';
import { PauseAgentUseCase } from '@/modules/agents/use-cases/pause-agent.use-case';
import { PreviewAgentPublishUseCase } from '@/modules/agents/use-cases/preview-agent-publish.use-case';
import { PublishAgentUseCase } from '@/modules/agents/use-cases/publish-agent.use-case';
import { RenameAgentUseCase } from '@/modules/agents/use-cases/rename-agent.use-case';
import { RestoreAgentVersionUseCase } from '@/modules/agents/use-cases/restore-agent-version.use-case';
import { ResumeAgentUseCase } from '@/modules/agents/use-cases/resume-agent.use-case';
import { RollbackAgentUseCase } from '@/modules/agents/use-cases/rollback-agent.use-case';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import { TestApiRequestUseCase } from '@/modules/agents/use-cases/test-api-request.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class AgentsModule extends defineModule({
  imports: [DiscoveryModule],
  providers: [
    AgentsRepository,
    AgentVersionsRepository,
    AutoCloseVersionsRepository,
    LiveScheduleTriggersRepository,
    ScheduleTriggerDirectoryService,
    AgentDraftsService,
    AgentFlowService,
    AgentPublishingService,
    AgentRuntimeReader,
    AgentViewsService,
    FlowReferenceChecksService,
    SimulatorTestsService,
    SampleAgentService,
    TemplatePromptsService,
    TemplateKnowledgeBasesService,
    AgentTemplatesService,
    CreateAgentUseCase,
    CreateAgentFromTemplateUseCase,
    ListAgentTemplatesUseCase,
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
    RollbackAgentUseCase,
    ListModelOptionsUseCase,
    TestApiRequestUseCase,
    CountAgentsUseCase,
    CountDraftChangesUseCase,
    GetInboxAgentOptionsUseCase,
  ],
  resolvers: [
    CreateAgentResolver,
    CreateAgentFromTemplateResolver,
    AgentTemplatesResolver,
    RenameAgentResolver,
    DescribeAgentResolver,
    DeleteAgentResolver,
    AgentsResolver,
    AgentFieldsResolver,
    InboxFilterOptionsFieldsResolver,
    SaveAgentDraftResolver,
    PublishAgentResolver,
    DuplicateAgentResolver,
    PauseAgentResolver,
    ResumeAgentResolver,
    RestoreAgentVersionResolver,
    RollbackAgentResolver,
    ModelOptionsResolver,
    TestApiRequestResolver,
  ],
  exports: [
    AgentRuntimeReader,
    AgentsRepository,
    AgentVersionsRepository,
    AutoCloseVersionsRepository,
    SampleAgentService,
    ScheduleTriggerDirectoryService,
  ],
}) {}
