import { IdPrefix } from '@agent-ic/contracts';
import { FlowIssueCode, createIssue, knowledgeBaseReferences } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue, KnowledgeBaseReference } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { FlowReferenceChecker } from '@/modules/agents';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { IdService } from '@/platform/ids/services/id.service';

const KNOWLEDGE_BASE_IDS_PATH = ['knowledgeBaseIds'];

@Injectable()
export class KnowledgeFlowReferenceChecker extends FlowReferenceChecker {
  constructor(
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly ids: IdService,
  ) {
    super();
  }

  async check(workspaceId: string, flow: FlowDocument): Promise<readonly FlowIssue[]> {
    const references = knowledgeBaseReferences(flow);
    const ids = new Set<string>();
    for (const reference of references) {
      const id = this.ids.tryFromPublic(IdPrefix.KnowledgeBase, reference.knowledgeBaseId);
      if (id !== null) {
        ids.add(id);
      }
    }
    const found = new Set(
      (await this.knowledgeBases.findByIds(workspaceId, [...ids])).map(
        (knowledgeBase) => knowledgeBase.id,
      ),
    );
    return references.flatMap((reference): readonly FlowIssue[] =>
      found.has(this.ids.tryFromPublic(IdPrefix.KnowledgeBase, reference.knowledgeBaseId) ?? '')
        ? []
        : [this.missingKnowledgeBaseIssue(reference)],
    );
  }

  private missingKnowledgeBaseIssue(reference: KnowledgeBaseReference): FlowIssue {
    return createIssue(FlowIssueCode.MissingKnowledgeBase, {
      nodeId: reference.nodeId,
      path: KNOWLEDGE_BASE_IDS_PATH,
    });
  }
}
