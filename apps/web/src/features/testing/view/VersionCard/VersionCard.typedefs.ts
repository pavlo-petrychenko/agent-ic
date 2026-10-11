import type { ReactNode } from 'react';
import type { VersionKind } from '@/features/testing/constants/versions.constants';

export interface VersionCardProps {
  number: number;
  kind: VersionKind;
  meta: string;
  lines: readonly string[];
  selected: boolean;
  actions: ReactNode | null;
}
