import type { ReactNode } from 'react';
import type { WorkspaceSection } from '@/features/workspace/constants/navigation.constants';

export interface SectionGateProps {
  workspaceId: string;
  section: WorkspaceSection;
  children: ReactNode;
}
