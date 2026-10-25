export enum GraphqlMetricName {
  Operations = 'graphql_operations_total',
  OperationDuration = 'graphql_operation_duration_seconds',
  WsConnections = 'graphql_ws_connections',
}

export enum GraphqlMetricHelp {
  Operations = 'GraphQL operations by type, root field and outcome',
  OperationDuration = 'GraphQL operation duration in seconds, by type, root field and outcome',
  WsConnections = 'Open GraphQL WebSocket connections',
}

export enum GraphqlMetricLabel {
  Type = 'type',
  RootField = 'root_field',
  Outcome = 'outcome',
}

export enum GraphqlOutcome {
  Success = 'success',
  Error = 'error',
}

export const UNKNOWN_GRAPHQL_LABEL = 'unknown';
