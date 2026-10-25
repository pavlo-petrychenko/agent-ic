export enum DatabaseMetricName {
  PoolConnections = 'db_pool_connections',
}

export enum DatabaseMetricHelp {
  PoolConnections = 'Database pool connections by pool and state',
}

export enum DatabaseMetricLabel {
  Pool = 'pool',
  State = 'state',
}

export enum DatabasePool {
  App = 'app',
  System = 'system',
}

export enum DatabasePoolState {
  Total = 'total',
  Idle = 'idle',
  Waiting = 'waiting',
}
