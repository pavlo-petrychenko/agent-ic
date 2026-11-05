import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import type { KnowledgeBaseReference } from '@flow/references/typedefs/knowledge-base-reference.typedefs';

const nodeKnowledgeBaseIds = (node: FlowNode): readonly string[] =>
  node.type === NodeType.Agent ? node.config.knowledgeBaseIds : [];

export const knowledgeBaseReferences = (flow: FlowDocument): readonly KnowledgeBaseReference[] =>
  flow.nodes.flatMap((node): readonly KnowledgeBaseReference[] =>
    nodeKnowledgeBaseIds(node).map((knowledgeBaseId) => ({
      nodeId: node.id,
      nodeKey: node.key,
      nodeLabel: node.label,
      knowledgeBaseId,
    })),
  );
