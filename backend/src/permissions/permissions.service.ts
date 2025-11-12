import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const slug = dto.slug.toUpperCase();
    const existing = await this.prisma.permission.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Bu slug bilan permission mavjud.');
    }

    return this.prisma.permission.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
      },
    });
  }

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission topilmadi.');
    }
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission topilmadi.');
    }

    const slug = dto.slug ? dto.slug.toUpperCase() : permission.slug;

    if (dto.slug && slug !== permission.slug) {
      const exists = await this.prisma.permission.findUnique({
        where: { slug },
      });
      if (exists) {
        throw new ConflictException('Bu slug bilan permission mavjud.');
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        name: dto.name ?? permission.name,
        slug,
        description: dto.description ?? permission.description,
      },
    });
  }

  async remove(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission topilmadi.');
    }

    return this.prisma.permission.delete({ where: { id } });
  }
}
