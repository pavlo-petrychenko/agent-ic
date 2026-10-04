import {
  Locale,
  PERMISSION_MATRIX,
  PermissionAction,
  PermissionResource,
  WorkspaceRole,
} from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { Actor } from '@/platform/context/typedefs/actor.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

const USER_ID = 'user-1';
const WORKSPACE_ID = 'workspace-1';

const ctxOf = (
  workspaceRole: WorkspaceRole | null,
  actor: Actor = { kind: ActorKind.User, userId: USER_ID },
): UseCaseCtx => ({
  actor,
  initiatedBy: null,
  workspaceId: workspaceRole === null ? null : WORKSPACE_ID,
  workspaceRole,
  traceId: 'trace',
  locale: Locale.En,
  clientIp: null,
});

const everyCheck = Object.values(WorkspaceRole).flatMap((role) =>
  Object.values(PermissionResource).flatMap((resource) =>
    Object.values(PermissionAction).map((action) => ({
      role,
      resource,
      action,
      allowed: PERMISSION_MATRIX[role][resource].includes(action),
    })),
  ),
);

describe('authorize', () => {
  it.each(everyCheck.filter((check) => check.allowed))(
    'lets $role $action $resource',
    ({ role, resource, action }) => {
      expect(authorize(ctxOf(role), resource, action)).toEqual({
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        role,
      });
    },
  );

  it.each(everyCheck.filter((check) => !check.allowed))(
    'refuses $role $action $resource',
    ({ role, resource, action }) => {
      expect(() => authorize(ctxOf(role), resource, action)).toThrow(PermissionDeniedError);
    },
  );

  it('refuses an operator every builder action on agents', () => {
    for (const action of Object.values(PermissionAction)) {
      expect(() =>
        authorize(ctxOf(WorkspaceRole.Operator), PermissionResource.Agents, action),
      ).toThrow(PermissionDeniedError);
    }
  });

  it('refuses a user with no workspace in the context', () => {
    expect(() => authorize(ctxOf(null), PermissionResource.Team, PermissionAction.View)).toThrow(
      WorkspaceAccessDeniedError,
    );
  });

  it('asks an anonymous caller to sign in first', () => {
    const anonymous = ctxOf(WorkspaceRole.Owner, { kind: ActorKind.Anonymous });

    expect(() => authorize(anonymous, PermissionResource.Team, PermissionAction.View)).toThrow(
      AuthenticationRequiredError,
    );
  });
});
