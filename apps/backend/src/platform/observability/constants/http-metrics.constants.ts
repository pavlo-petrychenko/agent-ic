export enum HttpMetricName {
  Requests = 'http_server_requests_total',
  RequestDuration = 'http_server_request_duration_seconds',
}

export enum HttpMetricHelp {
  Requests = 'HTTP requests served, by method, route template and status class',
  RequestDuration = 'HTTP request duration in seconds, by method, route template and status class',
}

export enum HttpMetricLabel {
  Method = 'method',
  Route = 'route',
  StatusClass = 'status_class',
}

export const UNMATCHED_ROUTE = 'unmatched';
export const STATUS_CLASS_DIVISOR = 100;
export const STATUS_CLASS_SUFFIX = 'xx';
export const RESPONSE_FINISH_EVENT = 'finish';
