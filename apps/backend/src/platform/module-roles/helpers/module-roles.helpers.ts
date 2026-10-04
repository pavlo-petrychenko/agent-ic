import { Module } from '@nestjs/common';
import type { DynamicModule, Type } from '@nestjs/common';
import { listenerSubscriptionProviders } from '@/platform/domain-events/domain-events.helpers';
import { FOR_ROLE_METHOD } from '@/platform/module-roles/constants/module-roles.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import type {
  ModuleDefinition,
  ModuleImport,
  RoleModule,
  RoleModuleClass,
  RoleTransports,
} from '@/platform/module-roles/typedefs/module-roles.typedefs';

export const isRoleModule = (value: unknown): value is RoleModule =>
  typeof value === 'function' &&
  FOR_ROLE_METHOD in value &&
  typeof value[FOR_ROLE_METHOD] === 'function';

export const importForRole = (entry: ModuleImport, role: Role): ModuleImport =>
  isRoleModule(entry) ? entry.forRole(role) : entry;

export const roleTransports = (definition: ModuleDefinition, role: Role): RoleTransports => {
  const transports: Readonly<Record<Role, RoleTransports>> = {
    [Role.Api]: {
      controllers: definition.controllers ?? [],
      providers: definition.resolvers ?? [],
    },
    [Role.Gateway]: {
      controllers: definition.gatewayControllers ?? [],
      providers: [],
    },
    [Role.Worker]: {
      controllers: [],
      providers: [...(definition.processors ?? []), ...(definition.listeners ?? [])],
    },
  };
  return transports[role];
};

export const roleModule = (
  module: Type<unknown>,
  definition: ModuleDefinition,
  role: Role,
): DynamicModule => {
  const transports = roleTransports(definition, role);
  return {
    module,
    imports: (definition.imports ?? []).map((entry) => importForRole(entry, role)),
    controllers: [...transports.controllers],
    providers: [
      ...(definition.providers ?? []),
      ...listenerSubscriptionProviders(definition.listeners ?? []),
      ...transports.providers,
      ...(definition.roleProviders?.[role] ?? []),
    ],
    exports: [...(definition.exports ?? [])],
  };
};

export const defineModule = (definition: ModuleDefinition): RoleModuleClass => {
  @Module({})
  class DefinedModule {
    static forRole(this: Type<unknown>, role: Role): DynamicModule {
      return roleModule(this, definition, role);
    }
  }
  return DefinedModule;
};
