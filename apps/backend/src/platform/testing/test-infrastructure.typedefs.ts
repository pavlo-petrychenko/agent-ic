import type { AppDatabase } from '@/platform/db/database.typedefs';

import type { TEST_INFRASTRUCTURE_KEY } from './test-infrastructure.constants';

export interface TestInfrastructure {
  readonly superuserUrl: string;
  readonly ownerUrl: string;
  readonly appUrl: string;
  readonly systemUrl: string;
  readonly redisUrl: string;
}

export interface DatabaseUrlParts {
  readonly user: string;
  readonly password: string;
  readonly host: string;
  readonly port: number;
  readonly database: string;
}

export interface ScratchDatabase {
  readonly db: AppDatabase;
  readonly close: () => Promise<void>;
}

declare module 'vitest' {
  export interface ProvidedContext {
    [TEST_INFRASTRUCTURE_KEY]: TestInfrastructure;
  }
}
