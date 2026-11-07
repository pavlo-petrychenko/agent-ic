export interface TelegramLinkCardProps {
  readonly code: string;
  readonly formattedCode: string;
  readonly botUsername: string;
  readonly minutesLeft: number;
  readonly onCopy: () => void;
}
