import type { Run } from '@/platform/graphql-server/generated/schema.generated';
import type { GraphqlParent } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

export type RunParent = GraphqlParent<Run, 'steps' | 'totals'>;
