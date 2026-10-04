import type { ComponentProps } from 'react';
import type { CodeTone } from '@/shared/ui/CodeBlock/CodeBlock.constants';

export interface CodeBlockProps extends Omit<ComponentProps<'div'>, 'children'> {
  code: string;
  tone?: CodeTone;
  wrap?: boolean | null;
  language?: string | null;
  copyLabel?: string | null;
}

export interface CodeCopy {
  copied: boolean;
  copy: () => void;
}
