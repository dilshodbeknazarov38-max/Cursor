import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { AdjustStockDto } from './dto/adjust-stock.dto';
import { WarehouseService } from './warehouse.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('warehouse')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('inventory')
  @Roles('SKLAD_ADMIN', 'SUPER_ADMIN')
  getInventory() {
    return this.warehouseService.getInventory();
  }

  @Post('adjust')
  @Roles('SKLAD_ADMIN', 'SUPER_ADMIN', 'TAMINOTCHI')
  adjustStock(@Body() dto: AdjustStockDto, @Req() req: AuthenticatedRequest) {
    return this.warehouseService.adjustStock(dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
