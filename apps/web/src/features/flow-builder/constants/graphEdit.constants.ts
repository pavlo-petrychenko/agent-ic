import type { FlowPoint } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export const NODE_KEY_SEPARATOR = '_';
export const FIRST_KEY_SUFFIX = 2;
export const NODE_KEY_SUFFIX_PATTERN = /_\d+$/;
export const DUPLICATE_OFFSET: FlowPoint = { x: 40, y: 40 };
