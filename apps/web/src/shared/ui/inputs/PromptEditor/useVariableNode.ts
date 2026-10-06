import { mergeAttributes, Node, nodeInputRule, nodePasteRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useMemo } from 'react';
import { PromptNodeName } from '@/shared/prompt/constants/promptDocument.constants';
import {
  formatVariableToken,
  PROMPT_VARIABLE_PASTE_PATTERN,
  PROMPT_VARIABLE_TYPED_PATTERN,
} from '@/shared/prompt/helpers/promptDocument.helpers';
import { VariableToken } from '@/shared/ui/inputs/PromptEditor/VariableToken';

const VARIABLE_ATTRIBUTE = 'data-variable';
const VARIABLE_TAG = 'span';
const PATH_ATTRIBUTE = 'path';

const readPath = (attrs: Readonly<Record<string, unknown>>): string => {
  const path = attrs[PATH_ATTRIBUTE];
  return typeof path === 'string' ? path : '';
};

const createVariableNode = () =>
  Node.create({
    name: PromptNodeName.Variable,
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
      return {
        [PATH_ATTRIBUTE]: {
          default: '',
          parseHTML: (element) => element.getAttribute(VARIABLE_ATTRIBUTE) ?? '',
        },
      };
    },

    parseHTML() {
      return [{ tag: `${VARIABLE_TAG}[${VARIABLE_ATTRIBUTE}]` }];
    },

    renderHTML({ node, HTMLAttributes }) {
      const path = readPath(node.attrs);
      return [
        VARIABLE_TAG,
        mergeAttributes(HTMLAttributes, { [VARIABLE_ATTRIBUTE]: path }),
        formatVariableToken(path),
      ];
    },

    renderText({ node }) {
      return formatVariableToken(readPath(node.attrs));
    },

    addNodeView() {
      return ReactNodeViewRenderer(VariableToken);
    },

    addInputRules() {
      return [
        nodeInputRule({
          find: PROMPT_VARIABLE_TYPED_PATTERN,
          type: this.type,
          getAttributes: (match) => ({ [PATH_ATTRIBUTE]: match[1] ?? '' }),
        }),
      ];
    },

    addPasteRules() {
      return [
        nodePasteRule({
          find: PROMPT_VARIABLE_PASTE_PATTERN,
          type: this.type,
          getAttributes: (match) => ({ [PATH_ATTRIBUTE]: match[1] ?? '' }),
        }),
      ];
    },
  });

export const useVariableNode = () => useMemo(() => createVariableNode(), []);
