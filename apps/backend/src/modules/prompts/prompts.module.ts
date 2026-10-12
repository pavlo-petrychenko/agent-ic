import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { CreatePromptFolderResolver } from '@/modules/prompts/resolvers/create-prompt-folder.resolver';
import { CreatePromptResolver } from '@/modules/prompts/resolvers/create-prompt.resolver';
import { DeletePromptFolderResolver } from '@/modules/prompts/resolvers/delete-prompt-folder.resolver';
import { PromptFoldersResolver } from '@/modules/prompts/resolvers/prompt-folders.resolver';
import { RenamePromptFolderResolver } from '@/modules/prompts/resolvers/rename-prompt-folder.resolver';
import { RenamePromptResolver } from '@/modules/prompts/resolvers/rename-prompt.resolver';
import { PromptFolderViewsService } from '@/modules/prompts/services/prompt-folder-views.service';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import { CreatePromptFolderUseCase } from '@/modules/prompts/use-cases/create-prompt-folder.use-case';
import { CreatePromptUseCase } from '@/modules/prompts/use-cases/create-prompt.use-case';
import { DeletePromptFolderUseCase } from '@/modules/prompts/use-cases/delete-prompt-folder.use-case';
import { ListPromptFoldersUseCase } from '@/modules/prompts/use-cases/list-prompt-folders.use-case';
import { RenamePromptFolderUseCase } from '@/modules/prompts/use-cases/rename-prompt-folder.use-case';
import { RenamePromptUseCase } from '@/modules/prompts/use-cases/rename-prompt.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class PromptsModule extends defineModule({
  providers: [
    PromptsRepository,
    PromptFoldersRepository,
    PromptVersionsRepository,
    PromptFolderViewsService,
    PromptViewsService,
    CreatePromptFolderUseCase,
    CreatePromptUseCase,
    DeletePromptFolderUseCase,
    ListPromptFoldersUseCase,
    RenamePromptFolderUseCase,
    RenamePromptUseCase,
  ],
  resolvers: [
    CreatePromptFolderResolver,
    CreatePromptResolver,
    DeletePromptFolderResolver,
    PromptFoldersResolver,
    RenamePromptFolderResolver,
    RenamePromptResolver,
  ],
}) {}
