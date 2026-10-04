import { Controller, Get } from '@nestjs/common';
import {
  SampleNotFoundError,
  SampleValidationError,
} from '@/platform/testing/sample-errors.fixture';
import { FailingRoute } from '@test/support/request-layer.constants';

@Controller(FailingRoute.Base)
export class FailingController {
  @Get(FailingRoute.NotFound)
  notFound(): never {
    throw new SampleNotFoundError();
  }

  @Get(FailingRoute.Validation)
  validation(): never {
    throw new SampleValidationError();
  }
}
