import type { FlowDocument } from '@agent-ic/flow';
import {
  FIRST_KEY_SUFFIX,
  NODE_KEY_MAX_LENGTH,
  NODE_KEY_SEPARATOR,
  NODE_KEY_SUFFIX_PATTERN,
} from '@/features/flow-builder/constants/graphEdit.constants';

const withSuffix = (base: string, suffix: number): string => {
  const tail = `${NODE_KEY_SEPARATOR}${suffix}`;
  return `${base.slice(0, NODE_KEY_MAX_LENGTH - tail.length)}${tail}`;
};

export const uniqueNodeKey = (document: FlowDocument, wanted: string): string => {
  const taken = new Set(document.nodes.map((node) => node.key));
  if (!taken.has(wanted)) {
    return wanted;
  }
  const base = wanted.replace(NODE_KEY_SUFFIX_PATTERN, '');
  let suffix = FIRST_KEY_SUFFIX;
  while (taken.has(withSuffix(base, suffix))) {
    suffix += 1;
  }
  return withSuffix(base, suffix);
};
