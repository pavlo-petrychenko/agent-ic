import { NodeType, RequestBodyKind, nodePorts } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type {
  ApiRequestConfig,
  RequestHeader,
} from '@/features/flow-builder/typedefs/apiRequest.typedefs';

export const updateApiRequest = (
  document: FlowDocument,
  nodeId: string,
  patch: Partial<ApiRequestConfig>,
): FlowDocument => {
  const next = updateNode(document, nodeId, (node) =>
    node.type === NodeType.ApiRequest ? { ...node, config: { ...node.config, ...patch } } : node,
  );
  const node = next.nodes.find((candidate) => candidate.id === nodeId);
  const ports = node === undefined ? [] : nodePorts(node);
  return {
    ...next,
    edges: next.edges.filter((edge) => edge.source !== nodeId || ports.includes(edge.sourcePort)),
  };
};

export const replaceHeader = (
  headers: readonly RequestHeader[],
  index: number,
  header: RequestHeader | null,
): RequestHeader[] =>
  header === null
    ? headers.filter((_, position) => position !== index)
    : [...headers.slice(0, index), header, ...headers.slice(index + 1)];

export const bodyOfKind = (
  kind: RequestBodyKind,
  body: ApiRequestConfig['body'],
): ApiRequestConfig['body'] => {
  const content = body.kind === RequestBodyKind.None ? '' : body.content;
  return kind === RequestBodyKind.None ? { kind } : { kind, content };
};
