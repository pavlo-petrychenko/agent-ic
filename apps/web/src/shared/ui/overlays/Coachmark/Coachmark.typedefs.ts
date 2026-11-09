import type { ReactNode } from 'react';
import type {
  COACHMARK_CENTERED,
  CoachmarkPlacement,
} from '@/shared/ui/overlays/Coachmark/Coachmark.constants';

export interface CoachmarkProgress {
  current: number;
  total: number;
}

export interface CoachmarkAction {
  label: string;
  onClick: () => void;
}

export interface CoachmarkRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CoachmarkSize {
  width: number;
  height: number;
}

export type CoachmarkResolvedPlacement = CoachmarkPlacement | typeof COACHMARK_CENTERED;

export interface CoachmarkPosition {
  top: number;
  left: number;
  placement: CoachmarkResolvedPlacement;
}

export interface CoachmarkPositionInput {
  spotlight: CoachmarkRect | null;
  card: CoachmarkSize;
  viewport: CoachmarkSize;
  placement: CoachmarkPlacement;
}

export interface CoachmarkProps {
  open: boolean;
  target: HTMLElement | null;
  title: string;
  children: ReactNode;
  progress?: CoachmarkProgress | null;
  formatProgress: (progress: CoachmarkProgress) => string;
  placement?: CoachmarkPlacement;
  primaryAction: CoachmarkAction;
  secondaryAction?: CoachmarkAction | null;
  skipStepAction?: CoachmarkAction | null;
  onDismiss: () => void;
  dismissLabel: string;
  closeLabel: string;
}
