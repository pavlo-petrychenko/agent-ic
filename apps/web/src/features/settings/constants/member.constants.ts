export const MEMBERS_PAGE_SIZE = 100;
export const LAST_ACTIVE_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

export enum MemberAction {
  TransferOwnership = 'transferOwnership',
  LeaveWorkspace = 'leaveWorkspace',
  RemoveMember = 'removeMember',
}
