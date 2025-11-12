import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async listMyNotifications(
    @Req() req: AuthenticatedRequest,
    @Query('faqatKorilmagan') faqatKorilmagan?: string,
    @Query('limit') limit?: string,
  ) {
    const onlyUnseen =
      faqatKorilmagan === '1' ||
      faqatKorilmagan === 'true' ||
      faqatKorilmagan === 'ha';
    const notifications = await this.notificationsService.listForUser(
      req.user?.sub ?? '',
      {
        onlyUnseen,
        limit: limit ? Number(limit) : undefined,
      },
    );

    return {
      message: 'Bildirishnomalar ro‘yxati muvaffaqiyatli olindi.',
      items: notifications,
    };
  }

  @Patch(':id/seen')
  async markAsSeen(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const notification = await this.notificationsService.markAsSeen(
      id,
      req.user?.sub ?? '',
    );
    return {
      message: 'Bildirishnoma ko‘rilgan deb belgilandi.',
      notification,
    };
  }

  @Patch('mark-all-seen')
  async markAllAsSeen(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.markAllAsSeen(req.user?.sub ?? '');
  }
}
