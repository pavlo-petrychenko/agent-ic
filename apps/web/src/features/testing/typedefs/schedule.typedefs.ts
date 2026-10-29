export interface ScheduleTrigger {
  id: string;
  name: string;
  silentForHours: number | null;
  notEscalated: boolean;
}
