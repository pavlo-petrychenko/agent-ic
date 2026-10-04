import { Controller } from '@nestjs/common';
import { GATEWAY_PROBE_ROUTE } from '@test/support/constants/module-roles.constants';

@Controller(GATEWAY_PROBE_ROUTE)
export class GatewayProbeController {}
