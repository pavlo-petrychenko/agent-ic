import { RenameError } from '@flow/document/constants/rename.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import type { KeyRenames } from '@flow/document/typedefs/rename.typedefs';
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

const rootKey = (path: string): string | null => {
  const first = parseVariablePath(path)?.[0];
  return first?.kind === PathSegmentKind.Name ? first.name : null;
};

const renameRoot = (path: string, text: string, renames: KeyRenames): string => {
  const from = rootKey(path);
  const to = from === null ? undefined : renames.get(from);
  if (from === null || to === undefined) {
    return text;
  }
  const leading = LEADING_WHITESPACE_PATTERN.exec(text)?.[0] ?? '';
  return `${leading}${to}${text.slice(leading.length + from.length)}`;
};

const renameInTemplate = (text: string, renames: KeyRenames): string =>
  parseTemplate(text)
    .map((segment) => {
      if (segment.kind === TemplateSegmentKind.Text) {
        return segment.text;
      }
      if (segment.kind === TemplateSegmentKind.Reference) {
        return `${TEMPLATE_OPEN}${renameRoot(segment.path, segment.raw.slice(TEMPLATE_OPEN.length), renames)}`;
      }
      return segment.raw;
    })
    .join('');

export const renameKeyReferences = (node: FlowNode, renames: KeyRenames): FlowNode =>
  mapNodeText(node, {
    template: (text) => renameInTemplate(text, renames),
    variable: (path) => renameRoot(path, path, renames),
  });

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
  const renames = new Map([[from, to]]);
  return {
    ...flow,
    nodes: flow.nodes.map((node) =>
      renameKeyReferences(node.key === from ? { ...node, key: to } : node, renames),
    ),
  };
};
