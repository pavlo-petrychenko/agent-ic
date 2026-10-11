import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class PromptsModule extends defineModule({
  providers: [PromptsRepository, PromptFoldersRepository, PromptVersionsRepository],
}) {}
