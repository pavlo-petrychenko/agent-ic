import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import type { Extension } from '@codemirror/state';

export const CODE_EDITOR_INDENT_UNIT = '  ';
export const CODE_EDITOR_ESCAPE_KEY = 'Escape';

export const CODE_EDITOR_LANGUAGE_EXTENSIONS: Readonly<Record<string, () => Extension>> = {
  json,
  javascript,
  js: javascript,
  typescript: () => javascript({ typescript: true }),
  ts: () => javascript({ typescript: true }),
};

export const CODE_EDITOR_THEME_RULES = {
  '&': {
    backgroundColor: 'var(--color-code-bg)',
    color: 'var(--color-code-fg)',
    font: 'var(--type-mono-lg)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    font: 'inherit',
    lineHeight: 'var(--leading-relaxed)',
  },
  '.cm-content': {
    padding: 'var(--space-14) var(--space-16)',
    caretColor: 'var(--color-code-fg)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-code-fg)',
  },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground':
    {
      backgroundColor: 'var(--color-accent-glow)',
    },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--color-dark)',
    color: 'inherit',
  },
};
