import { AgentsModule, FLOW_REFERENCE_CHECKER } from '@/modules/agents';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { CreatePromptFolderResolver } from '@/modules/prompts/resolvers/create-prompt-folder.resolver';
import { CreatePromptResolver } from '@/modules/prompts/resolvers/create-prompt.resolver';
import { DeletePromptFolderResolver } from '@/modules/prompts/resolvers/delete-prompt-folder.resolver';
import { DeletePromptResolver } from '@/modules/prompts/resolvers/delete-prompt.resolver';
import { DuplicatePromptResolver } from '@/modules/prompts/resolvers/duplicate-prompt.resolver';
import { MovePromptToFolderResolver } from '@/modules/prompts/resolvers/move-prompt-to-folder.resolver';
import { PromptFoldersResolver } from '@/modules/prompts/resolvers/prompt-folders.resolver';
import { PromptsResolver } from '@/modules/prompts/resolvers/prompts.resolver';
import { RenamePromptFolderResolver } from '@/modules/prompts/resolvers/rename-prompt-folder.resolver';
import { RenamePromptResolver } from '@/modules/prompts/resolvers/rename-prompt.resolver';
import { SavePromptVersionResolver } from '@/modules/prompts/resolvers/save-prompt-version.resolver';
import { PromptFlowReferenceChecker } from '@/modules/prompts/services/prompt-flow-reference-checker.service';
import { PromptFolderViewsService } from '@/modules/prompts/services/prompt-folder-views.service';
import { PromptImportService } from '@/modules/prompts/services/prompt-import.service';
import { PromptResolverService } from '@/modules/prompts/services/prompt-resolver.service';
import { PromptUsageService } from '@/modules/prompts/services/prompt-usage.service';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import { SamplePromptService } from '@/modules/prompts/services/sample-prompt.service';
import { CreatePromptFolderUseCase } from '@/modules/prompts/use-cases/create-prompt-folder.use-case';
import { CreatePromptUseCase } from '@/modules/prompts/use-cases/create-prompt.use-case';
import { DeletePromptFolderUseCase } from '@/modules/prompts/use-cases/delete-prompt-folder.use-case';
import { DeletePromptUseCase } from '@/modules/prompts/use-cases/delete-prompt.use-case';
import { DuplicatePromptUseCase } from '@/modules/prompts/use-cases/duplicate-prompt.use-case';
import { GetPromptVersionUseCase } from '@/modules/prompts/use-cases/get-prompt-version.use-case';
import { GetPromptUseCase } from '@/modules/prompts/use-cases/get-prompt.use-case';
import { ListPromptFoldersUseCase } from '@/modules/prompts/use-cases/list-prompt-folders.use-case';
import { ListPromptUsagesUseCase } from '@/modules/prompts/use-cases/list-prompt-usages.use-case';
import { ListPromptVersionsUseCase } from '@/modules/prompts/use-cases/list-prompt-versions.use-case';
import { ListPromptsUseCase } from '@/modules/prompts/use-cases/list-prompts.use-case';
import { MovePromptToFolderUseCase } from '@/modules/prompts/use-cases/move-prompt-to-folder.use-case';
import { RenamePromptFolderUseCase } from '@/modules/prompts/use-cases/rename-prompt-folder.use-case';
import { RenamePromptUseCase } from '@/modules/prompts/use-cases/rename-prompt.use-case';
import { SavePromptVersionUseCase } from '@/modules/prompts/use-cases/save-prompt-version.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class PromptsModule extends defineModule({
  imports: [AgentsModule],
  providers: [
    PromptsRepository,
    PromptFoldersRepository,
    PromptVersionsRepository,
    PromptFlowReferenceChecker,
    {
      provide: FLOW_REFERENCE_CHECKER,
      useExisting: PromptFlowReferenceChecker,
    },
    PromptFolderViewsService,
    PromptImportService,
    PromptResolverService,
    PromptUsageService,
    PromptViewsService,
    SamplePromptService,
    CreatePromptFolderUseCase,
    CreatePromptUseCase,
    DeletePromptFolderUseCase,
    DeletePromptUseCase,
    DuplicatePromptUseCase,
    GetPromptUseCase,
    GetPromptVersionUseCase,
    ListPromptFoldersUseCase,
    ListPromptUsagesUseCase,
    ListPromptVersionsUseCase,
    ListPromptsUseCase,
    MovePromptToFolderUseCase,
    RenamePromptFolderUseCase,
    RenamePromptUseCase,
    SavePromptVersionUseCase,
  ],
  resolvers: [
    CreatePromptFolderResolver,
    CreatePromptResolver,
    DeletePromptFolderResolver,
    DeletePromptResolver,
    DuplicatePromptResolver,
    MovePromptToFolderResolver,
    PromptFoldersResolver,
    PromptsResolver,
    RenamePromptFolderResolver,
    RenamePromptResolver,
    SavePromptVersionResolver,
  ],
  exports: [PromptResolverService, SamplePromptService],
}) {}
