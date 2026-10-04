export const APP_DATABASE = Symbol('APP_DATABASE');

export enum DatabaseRole {
  Owner = 'app_owner',
  App = 'app',
  System = 'app_system',
}

export const PREPARED_STATEMENTS_ENABLED = false;
export const CLIENT_CLOSE_TIMEOUT_SECONDS = 5;
export const TRANSACTION_ISOLATION_LEVEL = 'read committed';
