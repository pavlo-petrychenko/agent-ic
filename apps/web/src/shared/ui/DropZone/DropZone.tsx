import clsx from 'clsx';
import { useId, useRef } from 'react';
import {
  DROP_ZONE_ACCEPT_SEPARATOR,
  DROP_ZONE_ICON_SIZE,
} from '@/shared/ui/DropZone/DropZone.constants';
import type { DropZoneProps } from '@/shared/ui/DropZone/DropZone.typedefs';
import { useDropZone } from '@/shared/ui/DropZone/useDropZone';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import styles from '@/shared/ui/DropZone/DropZone.module.scss';

export function DropZone({
  title,
  dragTitle,
  browseLabel,
  hint,
  error = null,
  accept = [],
  multiple = true,
  disabled = false,
  onFiles,
  formatResult = null,
  className,
  ...rest
}: DropZoneProps) {
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    dragging,
    dragCount,
    result,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
  } = useDropZone({ accept, multiple, disabled, onFiles, formatResult });
  const failed = error !== null;

  return (
    <div
      {...rest}
      className={clsx(
        styles.root,
        failed && styles.error,
        dragging && styles.dragging,
        disabled && styles.disabled,
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className={styles.input}
        accept={accept.length === 0 ? undefined : accept.join(DROP_ZONE_ACCEPT_SEPARATOR)}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleInputChange}
      />
      <button
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-describedby={hintId}
        onClick={() => inputRef.current?.click()}
      >
        <Icon name={IconName.Upload} size={DROP_ZONE_ICON_SIZE} className={styles.icon} />
        <span className={styles.title}>
          {dragging ? (
            dragTitle(dragCount)
          ) : (
            <>
              {title} <span className={styles.browse}>{browseLabel}</span>
            </>
          )}
        </span>
      </button>
      <span id={hintId} className={clsx(styles.hint, failed && styles.errorText)}>
        {failed ? error : hint}
      </span>
      <output className={styles.live}>{result}</output>
    </div>
  );
}
