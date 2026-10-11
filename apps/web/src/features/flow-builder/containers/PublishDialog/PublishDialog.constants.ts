import { ChangeKind } from '@/features/flow-builder/constants/publish.constants';
import { DiffSign } from '@/shared/ui/display/DiffLine';

export const CHANGE_SIGN: Readonly<Record<ChangeKind, DiffSign>> = {
  [ChangeKind.Added]: DiffSign.Added,
  [ChangeKind.Changed]: DiffSign.Changed,
  [ChangeKind.Removed]: DiffSign.Removed,
};

export const ISSUE_STEP_SEPARATOR = ' · ';
export const VALID_CHECK_ID = 'valid';
export const SIMULATOR_CHECK_ID = 'simulator';
