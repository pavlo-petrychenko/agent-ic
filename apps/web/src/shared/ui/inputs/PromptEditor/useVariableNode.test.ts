import { Editor, getSchema } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import type { NodeType } from '@tiptap/pm/model';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import { describe, expect, it } from 'vitest';
import { PromptNodeName } from '@/shared/prompt/constants/promptDocument.constants';
import {
  documentToPrompt,
  normalizePathVariable,
  promptToDocument,
} from '@/shared/prompt/helpers/promptDocument.helpers';
import {
  createVariableNode,
  normalizePromptVariables,
} from '@/shared/ui/inputs/PromptEditor/useVariableNode';

const schema = getSchema([Document, Paragraph, Text, createVariableNode()]);

const variableType = (): NodeType => {
  const type = schema.nodes[PromptNodeName.Variable];
  if (type === undefined) {
    throw new RangeError(PromptNodeName.Variable);
  }
  return type;
};

const docWithText = (text: string) =>
  schema.node('doc', null, schema.node('paragraph', null, schema.text(text)));

const stateWithText = (text: string): EditorState =>
  EditorState.create({ schema, doc: docWithText(text) });

const textDoc = (state: EditorState): string => documentToPrompt(state.doc);

describe('normalizePromptVariables', () => {
  it('turns a valid token in plain text into a variable node', () => {
    const state = stateWithText('Hi {{name}}');

    const transaction = normalizePromptVariables(state, variableType());

    expect(transaction).not.toBeNull();
    const next = transaction === null ? state : state.apply(transaction);
    expect(next.doc.firstChild?.lastChild?.type.name).toBe(PromptNodeName.Variable);
    expect(textDoc(next)).toBe('Hi {{name}}');
  });

  it('leaves a token with a forbidden character as text', () => {
    const state = stateWithText('{{;name}}');

    expect(normalizePromptVariables(state, variableType())).toBeNull();
  });

  it('normalizes a valid token to lowercase when a normalizer is given', () => {
    const state = stateWithText('{{NAME}}');

    const transaction = normalizePromptVariables(state, variableType(), normalizePathVariable);

    expect(transaction).not.toBeNull();
    const next = transaction === null ? state : state.apply(transaction);
    expect(textDoc(next)).toBe('{{name}}');
  });

  it('keeps a valid token as written by default', () => {
    const state = stateWithText('{{NAME}}');

    const transaction = normalizePromptVariables(state, variableType());

    expect(transaction).not.toBeNull();
    const next = transaction === null ? state : state.apply(transaction);
    expect(textDoc(next)).toBe('{{NAME}}');
  });

  it('turns a token into a variable when the forbidden character is deleted', () => {
    const text = '{{;name}}';
    const semicolon = text.indexOf(';');
    const doc = docWithText(text);
    const state = EditorState.create({
      schema,
      doc,
      selection: TextSelection.create(doc, semicolon + 1),
    });
    const fixed = state.apply(state.tr.delete(semicolon + 1, semicolon + 2));

    const transaction = normalizePromptVariables(fixed, variableType());

    expect(transaction).not.toBeNull();
    const next = transaction === null ? fixed : fixed.apply(transaction);
    expect(next.doc.firstChild?.firstChild?.type.name).toBe(PromptNodeName.Variable);
    expect(textDoc(next)).toBe('{{name}}');
    expect(next.selection.from).toBe(2);
  });

  it('turns every valid token in one text node into a variable', () => {
    const state = stateWithText('{{first}} and {{second}}');

    const transaction = normalizePromptVariables(state, variableType());

    expect(transaction).not.toBeNull();
    const next = transaction === null ? state : state.apply(transaction);
    expect(textDoc(next)).toBe('{{first}} and {{second}}');
    expect(next.doc.firstChild?.childCount).toBe(3);
  });

  it('normalizes the document after a deletion in the editor', () => {
    const element = document.createElement('div');
    const editor = new Editor({
      element,
      extensions: [Document, Paragraph, Text, UndoRedo, createVariableNode()],
      content: promptToDocument('{{;name}}'),
    });
    editor.view.dispatch(editor.state.tr.delete(3, 4));

    expect(textDoc(editor.state)).toBe('{{name}}');
    expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe(PromptNodeName.Variable);

    editor.commands.undo();
    expect(textDoc(editor.state)).toBe('{{;name}}');
    editor.destroy();
  });
});
