export enum NotificationMetricName {
  EmailSends = 'email_sends_total',
}

export enum NotificationMetricHelp {
  EmailSends = 'Emails handed to a gateway, by gateway, template and outcome',
}

export enum NotificationMetricLabel {
  Gateway = 'gateway',
  Template = 'template',
  Outcome = 'outcome',
}

export enum EmailTemplate {
  Confirmation = 'confirmation',
  PasswordReset = 'password_reset',
  EmailChange = 'email_change',
  UsageThreshold = 'usage_threshold',
}

export enum EmailSendOutcome {
  Sent = 'sent',
  Failed = 'failed',
}
