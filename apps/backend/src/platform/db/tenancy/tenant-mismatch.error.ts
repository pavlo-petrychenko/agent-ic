import { TENANT_MISMATCH_MESSAGE } from './tenancy.constants';

export class TenantMismatchError extends Error {
  constructor(
    readonly currentWorkspaceId: string,
    readonly requestedWorkspaceId: string,
  ) {
    super(TENANT_MISMATCH_MESSAGE);
  }
}
