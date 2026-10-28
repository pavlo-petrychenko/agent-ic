export interface ChannelOutboundMessage {
  readonly messageId: string;
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly channelId: string | null;
  readonly endUserExternalId: string;
  readonly text: string;
  readonly quickReplies: readonly string[];
}
