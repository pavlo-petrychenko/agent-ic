import clsx from 'clsx';
import { useId } from 'react';
import {
  ICON_DEFAULT_SIZE,
  ICON_DEFAULT_STROKE_WIDTH,
  ICON_SHAPES,
  ICON_VIEW_BOX,
  IconName,
  IconShapeKind,
} from '@/shared/ui/Icon/Icon.constants';
import type { IconProps, IconShape } from '@/shared/ui/Icon/Icon.typedefs';
import styles from '@/shared/ui/Icon/Icon.module.scss';

function renderShape(shape: IconShape, index: number) {
  switch (shape.kind) {
    case IconShapeKind.Path:
      return <path key={index} d={shape.d} />;
    case IconShapeKind.Rect:
      return (
        <rect
          key={index}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
        />
      );
    case IconShapeKind.Circle:
      return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  }
}

export function Icon({
  name,
  size = ICON_DEFAULT_SIZE,
  strokeWidth = ICON_DEFAULT_STROKE_WIDTH,
  title = null,
  className,
  ...rest
}: IconProps) {
  const titleId = useId();
  const labelled = title !== null;

  return (
    <svg
      {...rest}
      data-icon={name}
      viewBox={ICON_VIEW_BOX}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-labelledby={labelled ? titleId : undefined}
      className={clsx(styles.root, name === IconName.Spinner && styles.spin, className)}
    >
      {labelled && <title id={titleId}>{title}</title>}
      {ICON_SHAPES[name].map(renderShape)}
    </svg>
  );
}
