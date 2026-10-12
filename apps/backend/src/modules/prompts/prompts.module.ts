import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { CreatePromptFolderResolver } from '@/modules/prompts/resolvers/create-prompt-folder.resolver';
import { DeletePromptFolderResolver } from '@/modules/prompts/resolvers/delete-prompt-folder.resolver';
import { PromptFoldersResolver } from '@/modules/prompts/resolvers/prompt-folders.resolver';
import { RenamePromptFolderResolver } from '@/modules/prompts/resolvers/rename-prompt-folder.resolver';
import { PromptFolderViewsService } from '@/modules/prompts/services/prompt-folder-views.service';
import { CreatePromptFolderUseCase } from '@/modules/prompts/use-cases/create-prompt-folder.use-case';
import { DeletePromptFolderUseCase } from '@/modules/prompts/use-cases/delete-prompt-folder.use-case';
import { ListPromptFoldersUseCase } from '@/modules/prompts/use-cases/list-prompt-folders.use-case';
import { RenamePromptFolderUseCase } from '@/modules/prompts/use-cases/rename-prompt-folder.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class PromptsModule extends defineModule({
  providers: [
    PromptsRepository,
    PromptFoldersRepository,
    PromptVersionsRepository,
    PromptFolderViewsService,
    CreatePromptFolderUseCase,
    DeletePromptFolderUseCase,
    ListPromptFoldersUseCase,
    RenamePromptFolderUseCase,
  ],
  resolvers: [
    CreatePromptFolderResolver,
    DeletePromptFolderResolver,
    PromptFoldersResolver,
    RenamePromptFolderResolver,
  ],
}) {}
