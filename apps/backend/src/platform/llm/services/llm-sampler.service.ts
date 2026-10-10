import { Injectable } from '@nestjs/common';

@Injectable()
export class LlmSamplerService {
  sample(rate: number): boolean {
    return Math.random() < rate;
  }
}
