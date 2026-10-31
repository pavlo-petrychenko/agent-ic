export enum ChannelHealthLogMessage {
  MarkBrokenError = 'could not mark the channel broken',
  CheckFailed = 'telegram token health check failed',
  CheckFinished = 'telegram token health check finished',
}

export const TELEGRAM_HEALTH_CHECK_INTERVAL_SECONDS = 30 * 60;
export const TELEGRAM_HEALTH_CHECK_CONCURRENCY = 10;
