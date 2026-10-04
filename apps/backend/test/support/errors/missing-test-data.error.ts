export class MissingTestDataError extends Error {
  constructor(readonly what: string) {
    super(`missing test data: ${what}`);
    this.name = new.target.name;
  }
}
