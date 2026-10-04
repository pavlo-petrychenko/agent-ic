import type { CodegenConfig } from '@graphql-codegen/cli';

const SCHEMA_PATH = '../../packages/api-schema/schema.graphql';
const DOCUMENTS_GLOB = 'src/**/*.graphql';
const OPERATIONS_BASE_DIR = 'src/';
const SCHEMA_TYPES_FILE = 'src/shared/api/generated/schema.generated.ts';
const SCHEMA_TYPES_FROM_BASE_DIR = 'shared/api/generated/schema.generated.ts';
const GENERATED_EXTENSION = '.generated.ts';
const TYPED_DOCUMENT_IMPORT = '@apollo/client#TypedDocumentNode';

const sharedConfig = {
  useTypeImports: true,
  avoidOptionals: true,
  immutableTypes: true,
  skipTypename: true,
  maybeValue: 'T | null',
  inputMaybeValue: 'T | null',
};

const config: CodegenConfig = {
  schema: SCHEMA_PATH,
  documents: DOCUMENTS_GLOB,
  generates: {
    [SCHEMA_TYPES_FILE]: {
      plugins: ['typescript'],
      config: sharedConfig,
    },
    [OPERATIONS_BASE_DIR]: {
      preset: 'near-operation-file',
      presetConfig: {
        extension: GENERATED_EXTENSION,
        baseTypesPath: SCHEMA_TYPES_FROM_BASE_DIR,
      },
      plugins: ['typescript-operations', 'typed-document-node'],
      config: { ...sharedConfig, documentNodeImport: TYPED_DOCUMENT_IMPORT },
    },
  },
};

export default config;
