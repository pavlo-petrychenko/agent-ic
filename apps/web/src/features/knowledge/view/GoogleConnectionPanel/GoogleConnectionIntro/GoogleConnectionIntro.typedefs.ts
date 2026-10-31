export interface GoogleConnectionIntroProps {
  readonly hasConnections: boolean;
  readonly starting: boolean;
  readonly onConnect: () => void;
}
