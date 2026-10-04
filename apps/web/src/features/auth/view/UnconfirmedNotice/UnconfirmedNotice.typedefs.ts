export interface UnconfirmedNoticeProps {
  email: string;
  resending: boolean;
  onResend: () => void;
}
