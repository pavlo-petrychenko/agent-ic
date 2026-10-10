export interface SetupChecklistProps {
  creating: boolean;
  inviteHref: string | null;
  onStart: () => void;
  onInvite: () => void;
}
