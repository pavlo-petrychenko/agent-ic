import type { Editor } from '@tiptap/core';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PromptNodeName } from '@/shared/prompt/constants/promptDocument.constants';
import { findVariableTrigger } from '@/shared/prompt/helpers/promptDocument.helpers';
import {
  FIRST_OPTION_INDEX,
  PROMPT_EDITOR_LEAF_PLACEHOLDER,
  PromptEditorKey,
} from '@/shared/ui/PromptEditor/PromptEditor.constants';
import type {
  VariableOption,
  VariableTrigger,
} from '@/shared/ui/PromptEditor/PromptEditor.typedefs';

interface UseVariableMenuOptions {
  variables: readonly VariableOption[];
  enabled: boolean;
}

interface ActiveState {
  key: string;
  index: number;
}

const triggerKey = (trigger: VariableTrigger | null): string =>
  trigger === null ? '' : `${trigger.from}:${trigger.query}`;

function filterVariables(
  variables: readonly VariableOption[],
  query: string,
): readonly VariableOption[] {
  const needle = query.toLowerCase();
  return variables.filter(
    (variable) =>
      variable.id.toLowerCase().includes(needle) || variable.label.toLowerCase().includes(needle),
  );
}

function readTrigger(editor: Editor): VariableTrigger | null {
  const { selection } = editor.state;
  if (!editor.isEditable || !selection.empty) {
    return null;
  }
  const { $from } = selection;
  const textBefore = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    PROMPT_EDITOR_LEAF_PLACEHOLDER,
  );
  const match = findVariableTrigger(textBefore);
  if (match === null) {
    return null;
  }
  const caret = editor.view.coordsAtPos(selection.from);
  return {
    from: selection.from - match.length,
    to: selection.from,
    query: match.query,
    anchor: DOMRect.fromRect({
      x: caret.left,
      y: caret.top,
      width: 0,
      height: caret.bottom - caret.top,
    }),
  };
}

export function useVariableMenu({ variables, enabled }: UseVariableMenuOptions) {
  const editorRef = useRef<Editor | null>(null);
  const [trigger, setTrigger] = useState<VariableTrigger | null>(null);
  const [dismissedFrom, setDismissedFrom] = useState<number | null>(null);
  const [activeState, setActiveState] = useState<ActiveState>({
    key: '',
    index: FIRST_OPTION_INDEX,
  });

  const options = useMemo(
    () => (trigger === null ? [] : filterVariables(variables, trigger.query)),
    [variables, trigger],
  );
  const open = enabled && trigger !== null && trigger.from !== dismissedFrom && options.length > 0;
  const currentKey = triggerKey(trigger);
  const activeIndex = Math.min(
    activeState.key === currentKey ? activeState.index : FIRST_OPTION_INDEX,
    Math.max(options.length - 1, FIRST_OPTION_INDEX),
  );

  const setActiveIndex = useCallback(
    (index: number) => setActiveState({ key: currentKey, index }),
    [currentKey],
  );

  const sync = useCallback((editor: Editor) => {
    editorRef.current = editor;
    const next = readTrigger(editor);
    if (next === null) {
      setDismissedFrom(null);
    }
    setTrigger((previous) =>
      previous !== null &&
      next !== null &&
      previous.from === next.from &&
      previous.to === next.to &&
      previous.query === next.query
        ? previous
        : next,
    );
  }, []);

  const insert = useCallback(
    (option: VariableOption) => {
      const editor = editorRef.current;
      if (editor === null || trigger === null) {
        return;
      }
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: trigger.from, to: trigger.to },
          { type: PromptNodeName.Variable, attrs: { path: option.id } },
        )
        .run();
    },
    [trigger],
  );

  const dismiss = useCallback(() => {
    setDismissedFrom(trigger === null ? null : trigger.from);
  }, [trigger]);

  const handleKeyDown = (event: KeyboardEvent): boolean => {
    const active = options[activeIndex];
    if (!open || active === undefined) {
      return false;
    }
    switch (event.key) {
      case PromptEditorKey.ArrowDown:
        setActiveIndex((activeIndex + 1) % options.length);
        return true;
      case PromptEditorKey.ArrowUp:
        setActiveIndex((activeIndex - 1 + options.length) % options.length);
        return true;
      case PromptEditorKey.Enter:
      case PromptEditorKey.Tab:
        insert(active);
        return true;
      case PromptEditorKey.Escape:
        dismiss();
        return true;
      default:
        return false;
    }
  };

  return {
    open,
    options,
    activeIndex,
    anchor: trigger === null ? null : trigger.anchor,
    setActiveIndex,
    insert,
    dismiss,
    sync,
    handleKeyDown,
  };
}
