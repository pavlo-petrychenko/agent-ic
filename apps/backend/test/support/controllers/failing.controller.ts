import { Controller, Get } from '@nestjs/common';
import { FailingRoute } from '@test/support/constants/request-layer.constants';
import {
  SampleNotFoundError,
  SampleValidationError,
} from '@test/support/fixtures/sample-errors.fixture';

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
