import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useContext } from 'react';
import { formatVariableToken } from '@/shared/prompt/helpers/promptDocument.helpers';
import { KnownVariablesContext } from '@/shared/ui/inputs/PromptEditor/knownVariables.context';
import { VariableChip } from '@/shared/ui/inputs/VariableChip/VariableChip';
import styles from '@/shared/ui/inputs/PromptEditor/VariableToken/VariableToken.module.scss';

export function VariableToken({ node }: NodeViewProps) {
  const known = useContext(KnownVariablesContext);
  const rawPath: unknown = node.attrs['path'];
  const path = typeof rawPath === 'string' ? rawPath : '';

  return (
    <NodeViewWrapper as="span" contentEditable={false} className={styles.root}>
      {known.has(path) ? (
        <VariableChip path={path} />
      ) : (
        <span className={styles.unknown}>{formatVariableToken(path)}</span>
      )}
    </NodeViewWrapper>
  );
}
