import { TENANT_MISMATCH_MESSAGE } from '@/platform/database/constants/tenant.constants';

export class TenantMismatchError extends Error {
  constructor(
    readonly currentWorkspaceId: string,
    readonly requestedWorkspaceId: string,
  ) {
    super(TENANT_MISMATCH_MESSAGE);
  }
}
