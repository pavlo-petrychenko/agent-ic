export enum ApiReplyMode {
  Response = 'response',
  Webhook = 'webhook',
}

export interface CreatedApiChannel {
  readonly name: string;
  readonly secret: string;
  readonly endpoint: string;
}

export interface ApiChannelMock {
  readonly id: string;
  readonly name: string;
  readonly agentId: string;
  readonly agentName: string;
  readonly sendsEvents: boolean;
  readonly endpoint: string;
  readonly secretMasked: string;
  readonly replyMode: ApiReplyMode;
  readonly webhook: string;
  readonly exampleRequest: string;
  readonly exampleResponse: string;
}
