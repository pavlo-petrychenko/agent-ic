import { PERMISSION_MATRIX, WorkspaceRole } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { WorkspaceSection } from '@/features/workspace/constants/navigation.constants';
import {
  canOpenSection,
  homeSection,
  visibleNavGroups,
} from '@/features/workspace/logic/helpers/navigation.helpers';

const permissionsOf = (role: WorkspaceRole) => PERMISSION_MATRIX[role];

const sectionsOf = (role: WorkspaceRole) =>
  visibleNavGroups(permissionsOf(role)).flatMap((group) =>
    group.entries.map((entry) => entry.section),
  );

describe('navigation helpers', () => {
  it('shows each role only the sections its permissions allow', () => {
    expect(sectionsOf(WorkspaceRole.Owner)).toEqual([
      WorkspaceSection.Agents,
      WorkspaceSection.Prompts,
      WorkspaceSection.Knowledge,
      WorkspaceSection.Inbox,
      WorkspaceSection.Testing,
      WorkspaceSection.Settings,
    ]);
    expect(sectionsOf(WorkspaceRole.Builder)).toEqual([
      WorkspaceSection.Agents,
      WorkspaceSection.Prompts,
      WorkspaceSection.Knowledge,
      WorkspaceSection.Testing,
      WorkspaceSection.Settings,
    ]);
    expect(sectionsOf(WorkspaceRole.Operator)).toEqual([
      WorkspaceSection.Inbox,
      WorkspaceSection.Settings,
    ]);
  });

  it('starts every role on its first allowed section', () => {
    expect(homeSection(permissionsOf(WorkspaceRole.Admin))).toBe(WorkspaceSection.Agents);
    expect(homeSection(permissionsOf(WorkspaceRole.Operator))).toBe(WorkspaceSection.Inbox);
  });

  it('blocks a section the role cannot view', () => {
    expect(canOpenSection(permissionsOf(WorkspaceRole.Operator), WorkspaceSection.Agents)).toBe(
      false,
    );
    expect(canOpenSection(permissionsOf(WorkspaceRole.Operator), WorkspaceSection.Testing)).toBe(
      false,
    );
    expect(canOpenSection(permissionsOf(WorkspaceRole.Builder), WorkspaceSection.Testing)).toBe(
      true,
    );
    expect(canOpenSection(permissionsOf(WorkspaceRole.Builder), WorkspaceSection.Inbox)).toBe(
      false,
    );
    expect(canOpenSection(permissionsOf(WorkspaceRole.Operator), WorkspaceSection.Settings)).toBe(
      true,
    );
  });
});
