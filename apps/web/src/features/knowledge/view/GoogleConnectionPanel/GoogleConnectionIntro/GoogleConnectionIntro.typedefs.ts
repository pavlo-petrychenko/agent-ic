export interface GoogleConnectionIntroProps {
  readonly hasConnections: boolean;
  readonly starting: boolean;
  readonly picking: boolean;
  readonly onConnect: () => void;
}
