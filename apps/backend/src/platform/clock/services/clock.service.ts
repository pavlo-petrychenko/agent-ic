export abstract class ClockService {
  abstract now(): Date;
  abstract sleep(milliseconds: number): Promise<void>;
}
