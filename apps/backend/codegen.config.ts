import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: ['src/modules/**/*.graphql', 'scalar JSON'],
  generates: {
    'src/platform/graphql-server/generated/schema.generated.ts': {
      plugins: ['typescript'],
      config: {
        scalars: { JSON: 'unknown' },
        useTypeImports: true,
        immutableTypes: true,
        avoidOptionals: true,
      },
    },
  },
};

export default config;
