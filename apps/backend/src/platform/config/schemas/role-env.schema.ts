import { z } from 'zod';
import { PLATFORM_ADMIN_DEV_ACCESS_IN_PRODUCTION_MESSAGE } from '@/platform/config/constants/env-value.constants';
import { EnvVar, NodeEnvironment } from '@/platform/config/constants/env.constants';
import { concurrencySchema, portSchema } from '@/platform/config/schemas/env-value.schema';
import type {
  ApiEnvironment,
  GatewayEnvironment,
  RoleEnvironment,
  WorkerEnvironment,
} from '@/platform/config/typedefs/env.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';

export const roleEnvSchemas: Record<Role, z.ZodType<RoleEnvironment>> = {
  [Role.Api]: z
    .object({
      [EnvVar.NodeEnv]: z.enum(NodeEnvironment),
      [EnvVar.ApiPort]: portSchema,
      [EnvVar.PlatformAdminDevAccess]: z.stringbool(),
    })
    .refine(
      (env) =>
        !env[EnvVar.PlatformAdminDevAccess] || env[EnvVar.NodeEnv] !== NodeEnvironment.Production,
      {
        path: [EnvVar.PlatformAdminDevAccess],
        message: PLATFORM_ADMIN_DEV_ACCESS_IN_PRODUCTION_MESSAGE,
      },
    )
    .transform((env): ApiEnvironment => ({
      role: Role.Api,
      port: env[EnvVar.ApiPort],
      platformAdmin: { devAccess: env[EnvVar.PlatformAdminDevAccess] },
    })),
  [Role.Gateway]: z
    .object({ [EnvVar.GatewayPort]: portSchema })
    .transform((env): GatewayEnvironment => ({
      role: Role.Gateway,
      port: env[EnvVar.GatewayPort],
    })),
  [Role.Worker]: z
    .object({ [EnvVar.WorkerPort]: portSchema, [EnvVar.WorkerConcurrency]: concurrencySchema })
    .transform((env): WorkerEnvironment => ({
      role: Role.Worker,
      port: env[EnvVar.WorkerPort],
      worker: { concurrency: env[EnvVar.WorkerConcurrency] },
    })),
};
