export enum PostgresErrorCode {
  RowLevelSecurityViolation = '42501',
  UniqueViolation = '23505',
  CheckViolation = '23514',
  ForeignKeyViolation = '23503',
}

export const ROW_LEVEL_SECURITY_VIOLATION = {
  cause: { code: PostgresErrorCode.RowLevelSecurityViolation },
};
export const UNIQUE_VIOLATION = {
  cause: { code: PostgresErrorCode.UniqueViolation },
};
export const CHECK_VIOLATION = {
  cause: { code: PostgresErrorCode.CheckViolation },
};
export const FOREIGN_KEY_VIOLATION = {
  cause: { code: PostgresErrorCode.ForeignKeyViolation },
};
