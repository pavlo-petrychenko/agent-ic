export enum ChannelPollerLogMessage {
  Started = 'telegram poller started',
  Stopped = 'telegram poller stopped',
  PollFailed = 'telegram poll failed',
  UpdateFailed = 'telegram update failed',
}

export const TELEGRAM_POLL_IDLE_MS = 5_000;
