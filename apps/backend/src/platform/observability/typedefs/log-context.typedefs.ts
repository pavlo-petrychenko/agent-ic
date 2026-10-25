import type { LogContextField } from '@/platform/observability/constants/logger.constants';

export type LogContextFields = Partial<Record<LogContextField, string>>;
