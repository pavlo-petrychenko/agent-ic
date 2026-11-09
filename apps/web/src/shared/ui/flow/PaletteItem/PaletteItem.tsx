import clsx from 'clsx';
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import {
  PALETTE_ITEM_DRAG_EFFECT,
  PALETTE_ITEM_DRAG_TYPE,
  PALETTE_ITEM_GHOST_OFFSET,
} from '@/shared/ui/flow/PaletteItem/PaletteItem.constants';
import type { PaletteItemProps } from '@/shared/ui/flow/PaletteItem/PaletteItem.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/shared/ui/flow/PaletteItem/PaletteItem.module.scss';

export function PaletteItem({
  label,
  kind,
  icon = null,
  onSelect,
  onInfo = null,
  infoLabel = null,
  disabled = false,
  dragData = null,
  dragging = false,
  ghost = null,
  className,
}: PaletteItemProps) {
  const [dragActive, setDragActive] = useState(false);
  const ghostRef = useRef<HTMLDivElement>(null);
  const draggable = dragData !== null && !disabled;
  const showInfo = onInfo !== null && infoLabel !== null;

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (dragData === null) {
      return;
    }
    event.dataTransfer.setData(PALETTE_ITEM_DRAG_TYPE, dragData);
    event.dataTransfer.effectAllowed = PALETTE_ITEM_DRAG_EFFECT;
    if (ghostRef.current !== null) {
      event.dataTransfer.setDragImage(
        ghostRef.current,
        PALETTE_ITEM_GHOST_OFFSET,
        PALETTE_ITEM_GHOST_OFFSET,
      );
    }
    setDragActive(true);
  };

  return (
    <>
      <div className={clsx(styles.item, showInfo && styles.withInfo)}>
        <button
          type="button"
          disabled={disabled}
          draggable={draggable}
          data-dragging={dragging || dragActive || undefined}
          className={clsx(
            styles.root,
            draggable && styles.draggable,
            (dragging || dragActive) && styles.dragging,
            className,
          )}
          onClick={onSelect}
          onDragStart={draggable ? handleDragStart : undefined}
          onDragEnd={draggable ? () => setDragActive(false) : undefined}
        >
          <NodeTile kind={kind} icon={icon} size={TileSize.Sm} />
          <span className={styles.label}>{label}</span>
        </button>
        {showInfo && (
          <IconButton
            icon={IconName.Info}
            label={infoLabel}
            size={IconButtonSize.Xs}
            className={styles.info}
            onClick={onInfo}
          />
        )}
      </div>
      {draggable && ghost !== null && (
        <div aria-hidden="true" inert className={styles.ghostHost}>
          <div ref={ghostRef} className={styles.ghost}>
            {ghost}
          </div>
        </div>
      )}
    </>
  );
}
