import { fileURLToPath } from 'node:url';

export const WEB_SOURCE_DIR = fileURLToPath(new URL('../../../../web/src', import.meta.url));
export const WEB_OPERATIONS_GLOB = '**/*.graphql';
export const WEB_OPERATION_ENCODING = 'utf8';
export const PLACEHOLDER_TEXT = 'placeholder';
export const PLACEHOLDER_SCALARS: Readonly<Record<string, unknown>> = {
  Int: 1,
  Float: 1,
  Boolean: true,
};
export const SERVER_STATUS_COST = 2;
export const SERVER_STATUS_SELECTION = 'serverStatus { version }';
