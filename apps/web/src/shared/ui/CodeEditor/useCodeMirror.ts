import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  temporarilySetTabFocusMode,
} from '@codemirror/commands';
import { bracketMatching, indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { drawSelection, EditorView, keymap } from '@codemirror/view';
import { type RefObject, useEffect, useRef } from 'react';
import {
  CODE_EDITOR_ESCAPE_KEY,
  CODE_EDITOR_INDENT_UNIT,
  CODE_EDITOR_LANGUAGE_EXTENSIONS,
  CODE_EDITOR_THEME_RULES,
} from '@/shared/ui/CodeEditor/CodeEditor.constants';
import type { UseCodeMirrorOptions } from '@/shared/ui/CodeEditor/CodeEditor.typedefs';

export function useCodeMirror({
  code,
  language,
  label,
  describedBy,
  onChange,
  active,
}: UseCodeMirrorOptions): RefObject<HTMLDivElement | null> {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const latestRef = useRef({ code, onChange });
  const syncingRef = useRef(false);

  useEffect(() => {
    latestRef.current = { code, onChange };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!active || host === null) {
      return undefined;
    }
    const languageExtension = CODE_EDITOR_LANGUAGE_EXTENSIONS[language.toLowerCase()];
    const contentAttributes: Record<string, string> = { 'aria-label': label };
    if (describedBy !== null) {
      contentAttributes['aria-describedby'] = describedBy;
    }
    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: latestRef.current.code,
        extensions: [
          history(),
          drawSelection(),
          bracketMatching(),
          indentUnit.of(CODE_EDITOR_INDENT_UNIT),
          keymap.of([
            { key: CODE_EDITOR_ESCAPE_KEY, run: temporarilySetTabFocusMode },
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.theme(CODE_EDITOR_THEME_RULES, { dark: true }),
          EditorView.contentAttributes.of(contentAttributes),
          languageExtension === undefined ? [] : languageExtension(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !syncingRef.current) {
              latestRef.current.onChange?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [active, language, label, describedBy]);

  useEffect(() => {
    const view = viewRef.current;
    if (view === null || view.state.doc.toString() === code) {
      return;
    }
    syncingRef.current = true;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
    syncingRef.current = false;
  }, [code]);

  return hostRef;
}
