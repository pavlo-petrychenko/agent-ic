import { WorkspaceRole } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { WorkspaceSection } from '@/features/workspace/constants/navigation.constants';
import {
  homeSection,
  visibleNavGroups,
} from '@/features/workspace/logic/helpers/navigation.helpers';

const sectionsOf = (role: WorkspaceRole) =>
  visibleNavGroups(role).flatMap((group) => group.entries.map((entry) => entry.section));

describe('navigation helpers', () => {
  it('shows each role only the sections its permissions allow', () => {
    expect(sectionsOf(WorkspaceRole.Owner)).toEqual([
      WorkspaceSection.Agents,
      WorkspaceSection.Inbox,
      WorkspaceSection.Settings,
    ]);
    expect(sectionsOf(WorkspaceRole.Builder)).toEqual([
      WorkspaceSection.Agents,
      WorkspaceSection.Settings,
    ]);
    expect(sectionsOf(WorkspaceRole.Operator)).toEqual([
      WorkspaceSection.Inbox,
      WorkspaceSection.Settings,
    ]);
  });

  it('starts every role on its first allowed section', () => {
    expect(homeSection(WorkspaceRole.Admin)).toBe(WorkspaceSection.Agents);
    expect(homeSection(WorkspaceRole.Operator)).toBe(WorkspaceSection.Inbox);
  });
});
