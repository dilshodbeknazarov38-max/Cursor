import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

import { FlowsService } from './flows.service';

@Controller('f')
export class FlowRedirectController {
  constructor(private readonly flowsService: FlowsService) {}

  @Get(':slug')
  async redirect(@Param('slug') slug: string, @Res() res: Response) {
    const destination = await this.flowsService.trackClick(slug);
    return res.redirect(destination);
  }
}
