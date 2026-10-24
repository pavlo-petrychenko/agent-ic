export enum ApiReplyMode {
  Response = 'response',
  Webhook = 'webhook',
}

export interface CreatedApiChannel {
  readonly name: string;
  readonly secret: string;
  readonly endpoint: string;
}
