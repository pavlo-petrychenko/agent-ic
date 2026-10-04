import type { ConnectionParams } from '@/platform/graphql-server/typedefs/connection-param.typedefs';

export const readConnectionParam = (params: ConnectionParams, name: string): string | null => {
  const value = params?.[name];
  return typeof value === 'string' ? value : null;
};
