import type { SVGProps } from 'react';
import type { IconName, IconShapeKind } from '@/shared/ui/Icon/Icon.constants';

export interface IconPathShape {
  readonly kind: IconShapeKind.Path;
  readonly d: string;
}

export interface IconRectShape {
  readonly kind: IconShapeKind.Rect;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rx: number;
}

export interface IconCircleShape {
  readonly kind: IconShapeKind.Circle;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

export type IconShape = IconPathShape | IconRectShape | IconCircleShape;

export interface IconProps extends Omit<
  SVGProps<SVGSVGElement>,
  'name' | 'children' | 'strokeWidth' | 'title'
> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  title?: string | null;
}
