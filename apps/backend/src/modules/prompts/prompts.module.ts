import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptFoldersResolver } from '@/modules/prompts/resolvers/prompt-folders.resolver';
import { PromptFolderViewsService } from '@/modules/prompts/services/prompt-folder-views.service';
import { ListPromptFoldersUseCase } from '@/modules/prompts/use-cases/list-prompt-folders.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class PromptsModule extends defineModule({
  providers: [
    PromptsRepository,
    PromptFoldersRepository,
    PromptVersionsRepository,
    PromptFolderViewsService,
    ListPromptFoldersUseCase,
  ],
  resolvers: [PromptFoldersResolver],
}) {}
