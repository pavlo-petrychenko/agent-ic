export enum ErrorCode {
  NotFound = 'NOT_FOUND',
  Forbidden = 'FORBIDDEN',
  Unauthenticated = 'UNAUTHENTICATED',
  Conflict = 'CONFLICT',
  PreconditionFailed = 'PRECONDITION_FAILED',
  BadUserInput = 'BAD_USER_INPUT',
  LimitReached = 'LIMIT_REACHED',
  UpstreamError = 'UPSTREAM_ERROR',
  Internal = 'INTERNAL',
}

export enum ErrorReason {
  Internal = 'INTERNAL',
  UpstreamFailed = 'UPSTREAM_FAILED',
  InvalidRequest = 'INVALID_REQUEST',
  RouteNotFound = 'ROUTE_NOT_FOUND',
  InvalidAccessToken = 'INVALID_ACCESS_TOKEN',
  InvalidId = 'INVALID_ID',
  InvalidCursor = 'INVALID_CURSOR',
  InvalidPageSize = 'INVALID_PAGE_SIZE',
}
