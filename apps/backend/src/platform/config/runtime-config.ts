const roles = ['api', 'gateway', 'worker'] as const;

export type Role = (typeof roles)[number];

const isRole = (value: string | undefined): value is Role => roles.some((role) => role === value);

export interface RuntimeConfig {
  readonly role: Role;
  readonly port: number;
}

export const readRuntimeConfig = (): RuntimeConfig => {
  const role = process.env['ROLE'];
  if (!isRole(role)) {
    throw new Error(`ROLE must be one of ${roles.join(', ')}`);
  }
  return { role, port: Number(process.env['PORT'] ?? 3000) };
};
