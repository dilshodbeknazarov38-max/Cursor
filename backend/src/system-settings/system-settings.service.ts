import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

type SettingDefinition = {
  key: string;
  defaultValue: string;
  description: string;
};

const DEFAULT_SETTINGS: SettingDefinition[] = [
  {
    key: 'PAYOUT_MIN_AMOUNT',
    defaultValue: '100000',
    description: 'Payout so‘rovlarini yuborish uchun minimal summa (so‘m).',
  },
  {
    key: 'PLATFORM_COMMISSION_PERCENT',
    defaultValue: '10',
    description: 'Platforma komissiyasi foizda (target/payout).',
  },
  {
    key: 'TELEGRAM_BOT_TOKEN',
    defaultValue: '',
    description: 'Bildirishnoma yuboriladigan Telegram bot tokeni.',
  },
  {
    key: 'TELEGRAM_CHAT_ID',
    defaultValue: '',
    description: 'Telegram bildirishnomalari yuboriladigan chat ID.',
  },
  {
    key: 'SMS_API_KEY',
    defaultValue: '',
    description: 'SMS xizmatini ulash uchun API kalit.',
  },
  {
    key: 'SMS_API_SECRET',
    defaultValue: '',
    description: 'SMS xizmatini ulash uchun API maxfiy kalit.',
  },
  {
    key: 'MAINTENANCE_MODE',
    defaultValue: 'false',
    description: 'Tizimni texnik rejimga o‘tkazish (true/false).',
  },
  {
    key: 'CACHE_VERSION',
    defaultValue: '1',
    description: 'Frontend keshini yangilash uchun versiya raqami.',
  },
];

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.systemSetting.findMany();
    const existingKeys = new Set(settings.map((setting) => setting.key));

    const missingDefinitions = DEFAULT_SETTINGS.filter(
      (setting) => !existingKeys.has(setting.key),
    );

    if (missingDefinitions.length > 0) {
      await this.prisma.$transaction(
        missingDefinitions.map((definition) =>
          this.prisma.systemSetting.create({
            data: {
              key: definition.key,
              value: definition.defaultValue,
              description: definition.description,
            },
          }),
        ),
      );
    }

    const finalSettings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return finalSettings.map((setting) => ({
      key: setting.key,
      value: setting.value,
      description:
        setting.description ??
        DEFAULT_SETTINGS.find((item) => item.key === setting.key)?.description ??
        '',
      updatedAt: setting.updatedAt,
    }));
  }

  async update(key: string, value: string) {
    const definition = DEFAULT_SETTINGS.find((item) => item.key === key);
    if (!definition) {
      throw new NotFoundException('Bunday sozlama mavjud emas.');
    }

    if (key === 'MAINTENANCE_MODE') {
      const normalized = value.trim().toLowerCase();
      if (!['true', 'false'].includes(normalized)) {
        throw new BadRequestException('Maintenance holati true yoki false bo‘lishi kerak.');
      }
    }

    if (key === 'PLATFORM_COMMISSION_PERCENT') {
      const percent = Number(value);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new BadRequestException('Komissiya foizi 0-100 oralig‘ida bo‘lishi kerak.');
      }
    }

    if (key === 'PAYOUT_MIN_AMOUNT') {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException('Minimal summa 0 dan kichik bo‘lishi mumkin emas.');
      }
    }

    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description: definition.description,
      },
      create: {
        key,
        value,
        description: definition.description,
      },
    });

    return {
      key: updated.key,
      value: updated.value,
      description: updated.description,
      updatedAt: updated.updatedAt,
    };
  }

  async reset(key: string) {
    const definition = DEFAULT_SETTINGS.find((item) => item.key === key);
    if (!definition) {
      throw new NotFoundException('Bunday sozlama mavjud emas.');
    }

    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: definition.defaultValue,
        description: definition.description,
      },
      create: {
        key: definition.key,
        value: definition.defaultValue,
        description: definition.description,
      },
    });

    return {
      key: updated.key,
      value: updated.value,
      description: updated.description,
      updatedAt: updated.updatedAt,
    };
  }
}
