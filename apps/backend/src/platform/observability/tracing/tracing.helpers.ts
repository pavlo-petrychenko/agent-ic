import { isOperationalUrl } from '../observability.helpers';
import { OTLP_TRACES_PATH } from './tracing.constants';

import type { IncomingMessage } from 'node:http';

export const tracesEndpoint = (endpoint: string): string =>
  new URL(OTLP_TRACES_PATH, endpoint).toString();

export const ignoreOperationalRequest = (request: IncomingMessage): boolean =>
  isOperationalUrl(request.url);
