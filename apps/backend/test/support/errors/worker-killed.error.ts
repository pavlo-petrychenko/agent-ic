export class WorkerKilledError extends Error {
  constructor(readonly nodeId: string) {
    super(`worker killed during ${nodeId}`);
    this.name = new.target.name;
  }
}
