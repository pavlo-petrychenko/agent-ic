export enum ApiReplyMode {
  Response = 'response',
  Webhook = 'webhook',
}

export interface ApiChannelSummary {
  readonly id: string;
  readonly name: string;
  readonly agentId: string | null;
  readonly agentName: string | null;
  readonly replyMode: ApiReplyMode;
}

export interface ApiChannelView extends ApiChannelSummary {
  readonly endpoint: string;
  readonly secretMasked: string;
  readonly showTyping: boolean;
  readonly webhook: string | null;
  readonly updatedAt: string;
  readonly updatedByName: string | null;
  readonly exampleRequest: string;
  readonly exampleResponse: string;
}

export interface CreatedApiChannel {
  readonly name: string;
  readonly secret: string;
  readonly endpoint: string;
}

export interface RotatedApiChannel {
  readonly name: string;
  readonly secret: string;
  readonly endpoint: string;
}
