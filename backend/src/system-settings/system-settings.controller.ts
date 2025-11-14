import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSystemSettingDto) {
    return this.settingsService.update(key, dto.value);
  }

  @Put(':key/reset')
  reset(@Param('key') key: string) {
    return this.settingsService.reset(key);
  }
}
