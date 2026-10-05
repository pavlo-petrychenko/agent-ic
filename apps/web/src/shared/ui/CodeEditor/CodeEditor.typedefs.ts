import type { ComponentProps } from 'react';

export interface CodeEditorProps extends Omit<ComponentProps<'section'>, 'onChange' | 'children'> {
  file: string;
  language: string;
  code: string;
  readOnly?: boolean;
  onChange?: ((code: string) => void) | null;
  label?: string | null;
  hint?: string | null;
  unsaved?: boolean;
  unsavedLabel?: string | null;
}

export interface UseCodeMirrorOptions {
  code: string;
  language: string;
  label: string;
  describedBy: string | null;
  onChange: ((code: string) => void) | null;
  active: boolean;
}
