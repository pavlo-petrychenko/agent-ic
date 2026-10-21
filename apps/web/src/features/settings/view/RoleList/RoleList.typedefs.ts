export interface RoleListItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface RoleListProps {
  readonly roles: readonly RoleListItem[];
  readonly selectedId: string;
  readonly ariaLabel: string;
  readonly newRoleLabel: string;
  readonly onSelect: (id: string) => void;
  readonly onNewRole: () => void;
}
