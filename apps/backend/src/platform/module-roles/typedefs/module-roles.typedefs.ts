import type { DynamicModule, ModuleMetadata, Provider, Type } from '@nestjs/common';
import type { Role } from '@/platform/module-roles/constants/role.constants';

export type ModuleImport = NonNullable<ModuleMetadata['imports']>[number];

export type ModuleExport = NonNullable<ModuleMetadata['exports']>[number];

export interface ModuleDefinition {
  readonly global?: boolean;
  readonly imports?: readonly ModuleImport[];
  readonly providers?: readonly Provider[];
  readonly exports?: readonly ModuleExport[];
  readonly resolvers?: readonly Type<unknown>[];
  readonly controllers?: readonly Type<unknown>[];
  readonly gatewayControllers?: readonly Type<unknown>[];
  readonly processors?: readonly Type<unknown>[];
  readonly listeners?: readonly Type<unknown>[];
  readonly roleProviders?: Readonly<Partial<Record<Role, readonly Provider[]>>>;
  readonly roleControllers?: Readonly<Partial<Record<Role, readonly Type<unknown>[]>>>;
}

export interface RoleModule {
  forRole(role: Role): DynamicModule;
}

export type RoleModuleClass = Type<object> & RoleModule;

export interface RoleTransports {
  readonly controllers: readonly Type<unknown>[];
  readonly providers: readonly Provider[];
}
