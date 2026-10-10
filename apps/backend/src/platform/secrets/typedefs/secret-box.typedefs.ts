export interface SealedSecret {
  readonly version: number;
  readonly iv: Buffer;
  readonly authTag: Buffer;
  readonly ciphertext: Buffer;
}
