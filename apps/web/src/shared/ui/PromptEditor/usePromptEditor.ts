import type { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import { useEditor } from '@tiptap/react';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { documentToPrompt, promptToDocument } from '@/shared/prompt/helpers/promptDocument.helpers';
import {
  NOT_FOUND_INDEX,
  PROMPT_EDITOR_LISTBOX_POPUP,
  PROMPT_EDITOR_PENDING_LIMIT,
  PROMPT_EDITOR_TEXTBOX_ROLE,
} from '@/shared/ui/PromptEditor/PromptEditor.constants';
import { useVariableNode } from '@/shared/ui/PromptEditor/useVariableNode';
import styles from '@/shared/ui/PromptEditor/PromptEditor.module.scss';

interface UsePromptEditorOptions {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  label: string;
  invalid: boolean;
  readOnly: boolean;
  describedBy: string | null;
  menuId: string;
  activeOptionId: string | null;
  onSync: (editor: Editor) => void;
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export function usePromptEditor({
  value,
  onChange,
  editable,
  label,
  invalid,
  readOnly,
  describedBy,
  menuId,
  activeOptionId,
  onSync,
  onKeyDown,
}: UsePromptEditorOptions) {
  const variableNode = useVariableNode();
  const [initialContent] = useState(() => promptToDocument(value));
  const pendingRef = useRef<string[]>([]);
  const keyDownRef = useRef(onKeyDown);

  useEffect(() => {
    keyDownRef.current = onKeyDown;
  });

  const extensions = useMemo(
    () => [Document, Paragraph, Text, UndoRedo, variableNode],
    [variableNode],
  );

  const editorProps = useMemo(
    () => ({
      attributes: {
        class: clsx(styles.content),
        role: PROMPT_EDITOR_TEXTBOX_ROLE,
        'aria-multiline': 'true',
        'aria-label': label,
        'aria-invalid': String(invalid),
        'aria-readonly': String(readOnly),
        'aria-haspopup': PROMPT_EDITOR_LISTBOX_POPUP,
        'aria-controls': menuId,
        ...(describedBy === null ? {} : { 'aria-describedby': describedBy }),
        ...(activeOptionId === null ? {} : { 'aria-activedescendant': activeOptionId }),
      },
      handleKeyDown: (_view: unknown, event: KeyboardEvent) => keyDownRef.current(event),
    }),
    [label, invalid, readOnly, describedBy, menuId, activeOptionId],
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable,
    editorProps,
    onUpdate: ({ editor: updated }) => {
      const next = documentToPrompt(updated.state.doc);
      pendingRef.current = [...pendingRef.current, next].slice(-PROMPT_EDITOR_PENDING_LIMIT);
      onChange(next);
    },
    onTransaction: ({ editor: changed }) => onSync(changed),
  });

  useEffect(() => {
    if (editor !== null && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (editor === null) {
      return;
    }
    const echoIndex = pendingRef.current.indexOf(value);
    if (echoIndex !== NOT_FOUND_INDEX) {
      pendingRef.current = pendingRef.current.slice(echoIndex + 1);
      return;
    }
    pendingRef.current = [];
    if (documentToPrompt(editor.state.doc) !== value) {
      editor.commands.setContent(promptToDocument(value), { emitUpdate: false });
    }
  }, [editor, value]);

  return editor;
}
