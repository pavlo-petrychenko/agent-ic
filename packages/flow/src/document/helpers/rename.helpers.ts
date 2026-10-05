import { RenameError } from '@flow/document/constants/rename.constants';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import { NODE_KEY_PATTERN } from '@flow/limits/constants/limit.constants';
import { RESERVED_ROOTS } from '@flow/scope/constants/scope.constants';
import {
  LEADING_WHITESPACE_PATTERN,
  PathSegmentKind,
  TEMPLATE_OPEN,
  TemplateSegmentKind,
} from '@flow/templates/constants/template.constants';
import { mapNodeText } from '@flow/templates/helpers/node-text.helpers';
import { parseVariablePath } from '@flow/templates/helpers/path.helpers';
import { parseTemplate } from '@flow/templates/helpers/template.helpers';

const startsWithKey = (path: string, key: string): boolean => {
  const first = parseVariablePath(path)?.[0];
  return first?.kind === PathSegmentKind.Name && first.name === key;
};

const renameRoot = (path: string, from: string, to: string): string => {
  const leading = LEADING_WHITESPACE_PATTERN.exec(path)?.[0] ?? '';
  return `${leading}${to}${path.slice(leading.length + from.length)}`;
};

const renameInVariable = (path: string, from: string, to: string): string =>
  startsWithKey(path, from) ? renameRoot(path, from, to) : path;

const renameInTemplate = (text: string, from: string, to: string): string =>
  parseTemplate(text)
    .map((segment) => {
      if (segment.kind === TemplateSegmentKind.Text) {
        return segment.text;
      }
      if (segment.kind === TemplateSegmentKind.Reference && startsWithKey(segment.path, from)) {
        return `${TEMPLATE_OPEN}${renameRoot(segment.raw.slice(TEMPLATE_OPEN.length), from, to)}`;
      }
      return segment.raw;
    })
    .join('');

export const renameNodeKey = (flow: FlowDocument, from: string, to: string): FlowDocument => {
  if (!flow.nodes.some((node) => node.key === from)) {
    throw new RangeError(RenameError.UnknownKey);
  }
  if (from === to) {
    return flow;
  }
  if (!NODE_KEY_PATTERN.test(to) || RESERVED_ROOTS.includes(to)) {
    throw new RangeError(RenameError.InvalidKey);
  }
  if (flow.nodes.some((node) => node.key === to)) {
    throw new RangeError(RenameError.KeyTaken);
  }
  return {
    ...flow,
    nodes: flow.nodes.map((node) =>
      mapNodeText(node.key === from ? { ...node, key: to } : node, {
        template: (text) => renameInTemplate(text, from, to),
        variable: (path) => renameInVariable(path, from, to),
      }),
    ),
  };
};
