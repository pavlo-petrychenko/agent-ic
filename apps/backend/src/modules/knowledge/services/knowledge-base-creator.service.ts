import { Injectable } from '@nestjs/common';
import { FIRST_KNOWLEDGE_BASE_NAME_NUMBER } from '@/modules/knowledge/constants/knowledge-input.constants';
import { KNOWLEDGE_TOOL_NAME_SHORT_SUFFIX_LENGTH } from '@/modules/knowledge/constants/knowledge-tool-name.constants';
import { KnowledgeBaseNameTakenError } from '@/modules/knowledge/errors/knowledge-base-name-taken.error';
import { numberedKnowledgeBaseName } from '@/modules/knowledge/helpers/knowledge-names.helpers';
import {
  knowledgeToolNameBase,
  knowledgeToolNameWithSuffix,
} from '@/modules/knowledge/helpers/knowledge-tool-name.helpers';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import type {
  KnowledgeBase,
  KnowledgeBaseCreation,
} from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { IdService } from '@/platform/ids/services/id.service';
import { EMBEDDING_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';

@Injectable()
export class KnowledgeBaseCreatorService {
  constructor(
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly configService: ConfigService,
    private readonly ids: IdService,
  ) {}

  async create(creation: KnowledgeBaseCreation): Promise<KnowledgeBase> {
    await this.knowledgeBases.lockNames(creation.workspaceId);
    if ((await this.knowledgeBases.findByName(creation.workspaceId, creation.name)) !== null) {
      throw new KnowledgeBaseNameTakenError();
    }
    return this.insert(creation);
  }

  async createWithFreeName(creation: KnowledgeBaseCreation): Promise<KnowledgeBase> {
    await this.knowledgeBases.lockNames(creation.workspaceId);
    return this.insert({ ...creation, name: await this.freeName(creation) });
  }

  private async freeName({ workspaceId, name }: KnowledgeBaseCreation): Promise<string> {
    let candidate = name;
    let number = FIRST_KNOWLEDGE_BASE_NAME_NUMBER;
    while ((await this.knowledgeBases.findByName(workspaceId, candidate)) !== null) {
      candidate = numberedKnowledgeBaseName(name, number);
      number += 1;
    }
    return candidate;
  }

  private async insert(creation: KnowledgeBaseCreation): Promise<KnowledgeBase> {
    const { workspaceId, name, description, createdByUserId } = creation;
    const knowledgeBaseId = this.ids.generate();
    const embeddingModel = this.configService.config.llm.embeddingModel;
    return this.knowledgeBases.insert({
      id: knowledgeBaseId,
      workspaceId,
      name,
      description,
      toolName: await this.toolName(workspaceId, name, knowledgeBaseId),
      toolDescription: null,
      embeddingModel,
      embeddingDimensions: EMBEDDING_CATALOG[embeddingModel].dimensions,
      createdByUserId,
    });
  }

  private async toolName(
    workspaceId: string,
    name: string,
    knowledgeBaseId: string,
  ): Promise<string> {
    const base = knowledgeToolNameBase(name);
    if ((await this.knowledgeBases.findByToolName(workspaceId, base)) === null) {
      return base;
    }
    const compactId = knowledgeBaseId.replaceAll('-', '');
    const short = knowledgeToolNameWithSuffix(
      base,
      compactId.slice(0, KNOWLEDGE_TOOL_NAME_SHORT_SUFFIX_LENGTH),
    );
    if ((await this.knowledgeBases.findByToolName(workspaceId, short)) === null) {
      return short;
    }
    return knowledgeToolNameWithSuffix(base, compactId);
  }
}
