import clsx from 'clsx';
import type { ColorSwatchProps } from '@/shared/ui/actions/ColorSwatch/ColorSwatch.typedefs';
import styles from '@/shared/ui/actions/ColorSwatch/ColorSwatch.module.scss';

export function ColorSwatch({
  color,
  label,
  selected = false,
  onSelect,
  className,
  style,
  ...rest
}: ColorSwatchProps) {
  return (
    <button
      {...rest}
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className={clsx(styles.root, selected && styles.selected, className)}
      style={{ ...style, background: color }}
      onClick={onSelect}
    />
  );
}
