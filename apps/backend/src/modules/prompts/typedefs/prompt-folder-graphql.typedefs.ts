import type { PromptFolder } from '@/platform/graphql-server/generated/schema.generated';
import type { GraphqlParent } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

export type PromptFolderParent = GraphqlParent<PromptFolder, 'prompts'>;
