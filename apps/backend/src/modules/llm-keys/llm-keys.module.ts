import { AgentsModule, FLOW_REFERENCE_CHECKER } from '@/modules/agents';
import { CleanUpWorkspaceListener } from '@/modules/llm-keys/listeners/clean-up-workspace.listener';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { AddLlmKeyResolver } from '@/modules/llm-keys/resolvers/add-llm-key.resolver';
import { CheckLlmKeyResolver } from '@/modules/llm-keys/resolvers/check-llm-key.resolver';
import { LlmKeyModelsResolver } from '@/modules/llm-keys/resolvers/llm-key-models.resolver';
import { LlmKeyOptionsResolver } from '@/modules/llm-keys/resolvers/llm-key-options.resolver';
import { LlmKeysResolver } from '@/modules/llm-keys/resolvers/llm-keys.resolver';
import { RemoveLlmKeyResolver } from '@/modules/llm-keys/resolvers/remove-llm-key.resolver';
import { SetLlmKeyFallbackResolver } from '@/modules/llm-keys/resolvers/set-llm-key-fallback.resolver';
import { LlmKeyFlowReferenceChecker } from '@/modules/llm-keys/services/llm-key-flow-reference-checker.service';
import { LlmKeyProbeService } from '@/modules/llm-keys/services/llm-key-probe.service';
import { LlmKeyResolverService } from '@/modules/llm-keys/services/llm-key-resolver.service';
import { LlmKeyUsageService } from '@/modules/llm-keys/services/llm-key-usage.service';
import { LlmKeyViewsService } from '@/modules/llm-keys/services/llm-key-views.service';
import { AddLlmKeyUseCase } from '@/modules/llm-keys/use-cases/add-llm-key.use-case';
import { CheckLlmKeyUseCase } from '@/modules/llm-keys/use-cases/check-llm-key.use-case';
import { CleanUpWorkspaceUseCase } from '@/modules/llm-keys/use-cases/clean-up-workspace.use-case';
import { ListLlmKeyModelsUseCase } from '@/modules/llm-keys/use-cases/list-llm-key-models.use-case';
import { ListLlmKeyOptionsUseCase } from '@/modules/llm-keys/use-cases/list-llm-key-options.use-case';
import { ListLlmKeysUseCase } from '@/modules/llm-keys/use-cases/list-llm-keys.use-case';
import { RemoveLlmKeyUseCase } from '@/modules/llm-keys/use-cases/remove-llm-key.use-case';
import { SetLlmKeyFallbackUseCase } from '@/modules/llm-keys/use-cases/set-llm-key-fallback.use-case';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class LlmKeysModule extends defineModule({
  global: true,
  imports: [AgentsModule],
  providers: [
    LlmKeysRepository,
    LlmKeyResolverService,
    { provide: LlmKeyResolver, useExisting: LlmKeyResolverService },
    LlmKeyFlowReferenceChecker,
    { provide: FLOW_REFERENCE_CHECKER, useExisting: LlmKeyFlowReferenceChecker },
    LlmKeyProbeService,
    LlmKeyUsageService,
    LlmKeyViewsService,
    AddLlmKeyUseCase,
    CheckLlmKeyUseCase,
    CleanUpWorkspaceUseCase,
    ListLlmKeyModelsUseCase,
    ListLlmKeyOptionsUseCase,
    ListLlmKeysUseCase,
    RemoveLlmKeyUseCase,
    SetLlmKeyFallbackUseCase,
  ],
  resolvers: [
    AddLlmKeyResolver,
    CheckLlmKeyResolver,
    LlmKeyModelsResolver,
    LlmKeyOptionsResolver,
    LlmKeysResolver,
    RemoveLlmKeyResolver,
    SetLlmKeyFallbackResolver,
  ],
  exports: [LlmKeyResolver],
  listeners: [CleanUpWorkspaceListener],
}) {}
