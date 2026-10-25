export enum CacheMetricName {
  Requests = 'cache_requests_total',
}

export enum CacheMetricHelp {
  Requests = 'Cache reads by entry and result',
}

export enum CacheMetricLabel {
  Entry = 'entry',
  Result = 'result',
}

export enum CacheResult {
  Hit = 'hit',
  Miss = 'miss',
}
