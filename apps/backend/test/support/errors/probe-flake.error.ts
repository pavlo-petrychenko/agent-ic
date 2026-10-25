export class ProbeFlakeError extends Error {
  constructor(readonly probeId: string) {
    super(`probe ${probeId} failed on purpose`);
    this.name = new.target.name;
  }
}
