import { InputRule, mergeAttributes, Node, nodePasteRule } from '@tiptap/core';
import type { NodeType } from '@tiptap/pm/model';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { useMemo } from 'react';
import { PromptNodeName } from '@/shared/prompt/constants/promptDocument.constants';
import {
  formatVariableToken,
  PROMPT_VARIABLE_PASTE_PATTERN,
  PROMPT_VARIABLE_TYPED_PATTERN,
} from '@/shared/prompt/helpers/promptDocument.helpers';
import type { PathNormalizer } from '@/shared/prompt/typedefs/promptDocument.typedefs';
import { VariableToken } from '@/shared/ui/inputs/PromptEditor/VariableToken';

const VARIABLE_ATTRIBUTE = 'data-variable';
const VARIABLE_TAG = 'span';
const PATH_ATTRIBUTE = 'path';
const VARIABLE_PATTERN = new RegExp(
  PROMPT_VARIABLE_PASTE_PATTERN.source,
  PROMPT_VARIABLE_PASTE_PATTERN.flags,
);
const VARIABLE_NORMALIZER_KEY = new PluginKey('promptVariableNormalizer');

const readPath = (attrs: Readonly<Record<string, unknown>>): string => {
  const path = attrs[PATH_ATTRIBUTE];
  return typeof path === 'string' ? path : '';
};

interface VariableMatch {
  readonly from: number;
  readonly to: number;
  readonly path: string;
}

const identityPathVariable = (path: string): string => path;

const variableMatches = (
  state: EditorState,
  normalizeVariable: PathNormalizer,
): readonly VariableMatch[] => {
  const matches: VariableMatch[] = [];
  state.doc.descendants((node, position) => {
    if (!node.isText || node.text === undefined) {
      return;
    }
    for (const match of node.text.matchAll(VARIABLE_PATTERN)) {
      const path = match[1];
      if (path === undefined) {
        continue;
      }
      matches.push({
        from: position + match.index,
        to: position + match.index + match[0].length,
        path: normalizeVariable(path),
      });
    }
  });
  return matches;
};

export const normalizePromptVariables = (
  state: EditorState,
  type: NodeType,
  normalizeVariable: PathNormalizer = identityPathVariable,
): Transaction | null => {
  const matches = variableMatches(state, normalizeVariable);
  if (matches.length === 0) {
    return null;
  }
  const transaction = state.tr;
  const selection = state.selection.from;
  let selectionAfter: number | null = null;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    if (match === undefined) {
      continue;
    }
    if (selection > match.from && selection < match.to) {
      selectionAfter = match.from + 1;
    }
    transaction.replaceWith(match.from, match.to, type.create({ [PATH_ATTRIBUTE]: match.path }));
  }
  if (selectionAfter !== null) {
    transaction.setSelection(TextSelection.create(transaction.doc, selectionAfter));
  }
  return transaction;
};

export const createVariableNode = (normalizeVariable: PathNormalizer = identityPathVariable) =>
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
        new InputRule({
          find: PROMPT_VARIABLE_TYPED_PATTERN,
          handler: ({ state, range, match }) => {
            state.tr.replaceWith(
              range.from,
              range.to,
              this.type.create({ [PATH_ATTRIBUTE]: normalizeVariable(match[1] ?? '') }),
            );
          },
        }),
      ];
    },

    addPasteRules() {
      return [
        nodePasteRule({
          find: PROMPT_VARIABLE_PASTE_PATTERN,
          type: this.type,
          getAttributes: (match) => ({
            [PATH_ATTRIBUTE]: normalizeVariable(match[1] ?? ''),
          }),
        }),
      ];
    },

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: VARIABLE_NORMALIZER_KEY,
          appendTransaction: (transactions, _oldState, newState) => {
            if (!transactions.some((transaction) => transaction.docChanged)) {
              return null;
            }
            const type = newState.schema.nodes[PromptNodeName.Variable];
            return type === undefined
              ? null
              : normalizePromptVariables(newState, type, normalizeVariable);
          },
        }),
      ];
    },
  });

export const useVariableNode = (normalizeVariable?: PathNormalizer) =>
  useMemo(() => createVariableNode(normalizeVariable), [normalizeVariable]);
