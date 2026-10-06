import clsx from 'clsx';
import { useId } from 'react';
import { CodeBlock } from '@/shared/ui/display/CodeBlock/CodeBlock';
import { CodeTone } from '@/shared/ui/display/CodeBlock/CodeBlock.constants';
import type { CodeEditorProps } from '@/shared/ui/display/CodeEditor/CodeEditor.typedefs';
import { useCodeMirror } from '@/shared/ui/display/CodeEditor/useCodeMirror';
import { StatusDot } from '@/shared/ui/display/StatusDot/StatusDot';
import { StatusKind } from '@/shared/ui/display/StatusDot/StatusDot.constants';
import styles from '@/shared/ui/display/CodeEditor/CodeEditor.module.scss';

export function CodeEditor({
  file,
  language,
  code,
  readOnly = true,
  onChange = null,
  label = null,
  hint = null,
  unsaved = false,
  unsavedLabel = null,
  className,
  ...rest
}: CodeEditorProps) {
  const fileId = useId();
  const hintId = useId();
  const editable = !readOnly && onChange !== null;
  const hostRef = useCodeMirror({
    code,
    language,
    label: label ?? file,
    describedBy: hint === null ? null : hintId,
    onChange,
    active: editable,
  });

  return (
    <section
      {...rest}
      aria-labelledby={fileId}
      className={clsx(styles.root, editable && styles.editable, className)}
    >
      <header className={styles.header}>
        <span className={styles.file}>
          {unsaved && <StatusDot kind={StatusKind.Warn} aria-label={unsavedLabel ?? undefined} />}
          <span id={fileId}>{file}</span>
        </span>
        <span className={styles.language}>{language}</span>
      </header>
      {editable ? (
        <>
          <div ref={hostRef} className={styles.editor} />
          {hint !== null && (
            <span id={hintId} className={styles.hint}>
              {hint}
            </span>
          )}
        </>
      ) : (
        <CodeBlock code={code} tone={CodeTone.Dark} language={language} className={styles.body} />
      )}
    </section>
  );
}
