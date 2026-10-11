import { NodeType, RequestBodyKind, renderTemplate, resolvePath } from '@agent-ic/flow';
import type { ApiRequestNode, FlowDocument } from '@agent-ic/flow';
import {
  API_REQUEST_CONTENT_TYPE,
  CONTENT_TYPE_HEADER,
} from '@/modules/agents/constants/api-request-test.constants';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import type { OutboundHttpRequest } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export const findApiRequestNode = (flow: FlowDocument, nodeId: string): ApiRequestNode | null =>
  flow.nodes.find(
    (node): node is ApiRequestNode => node.id === nodeId && node.type === NodeType.ApiRequest,
  ) ?? null;

export const toOutboundRequest = (
  node: ApiRequestNode,
  variables: Readonly<Record<string, unknown>>,
): OutboundHttpRequest => {
  const render = (text: string): string =>
    renderTemplate(text, (path) => resolvePath(variables, path));
  const { body, headers } = node.config;
  const contentType = API_REQUEST_CONTENT_TYPE[body.kind];
  const rendered = Object.fromEntries(
    headers.map((header) => [header.name.toLowerCase(), render(header.value)]),
  );
  return {
    method: node.config.method,
    url: render(node.config.url),
    headers: contentType === null ? rendered : { [CONTENT_TYPE_HEADER]: contentType, ...rendered },
    body: body.kind === RequestBodyKind.None ? null : render(body.content),
    timeoutMs: node.config.timeoutSeconds * MILLISECONDS_PER_SECOND,
  };
};
