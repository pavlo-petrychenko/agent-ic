import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import type {
  PromptFolder,
  PromptFolderView,
} from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptFolderViewsService {
  constructor(private readonly ids: IdService) {}

  folderView(folder: PromptFolder): PromptFolderView {
    return {
      id: this.ids.toPublic(IdPrefix.PromptFolder, folder.id),
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  folderViews(folders: readonly PromptFolder[]): PromptFolderView[] {
    return folders.map((folder) => this.folderView(folder));
  }
}
