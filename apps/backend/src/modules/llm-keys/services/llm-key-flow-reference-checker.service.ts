import { IdPrefix } from '@agent-ic/contracts';
import { FlowIssueCode, ModelProviderKind, createIssue, modelReferences } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue, ModelReference } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { FlowReferenceChecker } from '@/modules/agents';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { IdService } from '@/platform/ids/services/id.service';

const MODEL_PATH = ['model'];

@Injectable()
export class LlmKeyFlowReferenceChecker extends FlowReferenceChecker {
  constructor(
    private readonly keys: LlmKeysRepository,
    private readonly ids: IdService,
  ) {
    super();
  }

  async check(workspaceId: string, flow: FlowDocument): Promise<readonly FlowIssue[]> {
    const references = modelReferences(flow).filter(
      ({ provider }) => provider.kind === ModelProviderKind.Workspace,
    );
    if (references.length === 0) {
      return [];
    }
    const known = new Set((await this.keys.listByWorkspace(workspaceId)).map(({ id }) => id));
    return references
      .filter((reference) => !this.keyExists(reference, known))
      .map((reference) =>
        createIssue(FlowIssueCode.MissingProviderKey, {
          nodeId: reference.nodeId,
          path: MODEL_PATH,
        }),
      );
  }

  private keyExists({ provider }: ModelReference, known: ReadonlySet<string>): boolean {
    if (provider.kind !== ModelProviderKind.Workspace) {
      return true;
    }
    const keyId = this.ids.tryFromPublic(IdPrefix.LlmKey, provider.providerKeyId);
    return keyId !== null && known.has(keyId);
  }
}
