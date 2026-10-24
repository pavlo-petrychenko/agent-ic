export const PORT_MIN = 1;
export const PORT_MAX = 65535;
export const POOL_SIZE_MIN = 1;
export const DATABASE_URL_PROTOCOL = /^postgres(ql)?$/;
export const REDIS_URL_PROTOCOL = /^rediss?$/;
export const NO_REDIS_KEY_PREFIX = '';
export const WORKER_CONCURRENCY_MIN = 1;
export const USAGE_LIMIT_MIN = 1;
export const TRACES_SAMPLER_RATIO_DEFAULT = 1;
export const SECRET_MIN_LENGTH = 32;
export const PUBLIC_URL_PROTOCOL = /^https?$/;
export const PLATFORM_ADMIN_DEV_ACCESS_IN_PRODUCTION_MESSAGE =
  'platform admin dev access is not allowed in production';
export const OTEL_ENDPOINT_REQUIRED_MESSAGE = 'is required when OTEL_SDK_DISABLED is false';
