import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/modules/**/*.graphql',
  generates: {
    'src/platform/graphql-server/generated/schema.generated.ts': {
      plugins: ['typescript'],
      config: { useTypeImports: true, immutableTypes: true, avoidOptionals: true },
    },
  },
};

export default config;
