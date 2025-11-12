import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: { permissions: { include: { permission: true } } };
}>;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const slug = dto.slug.toUpperCase();
    const existing = await this.prisma.role.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Bu slug bilan rol allaqachon mavjud.');
    }

    return this.prisma.role.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
      },
    });
  }

  async findAll(): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) {
      throw new NotFoundException('Rol topilmadi.');
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Rol topilmadi.');
    }

    const slug = dto.slug ? dto.slug.toUpperCase() : role.slug;

    if (dto.slug && slug !== role.slug) {
      const slugExists = await this.prisma.role.findUnique({ where: { slug } });
      if (slugExists) {
        throw new ConflictException('Bu slug bilan rol allaqachon mavjud.');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name ?? role.name,
        slug,
        description: dto.description ?? role.description,
      },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Rol topilmadi.');
    }

    return this.prisma.role.delete({ where: { id } });
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Rol topilmadi.');
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        slug: { in: dto.permissionSlugs.map((slug) => slug.toUpperCase()) },
      },
    });

    if (permissions.length !== dto.permissionSlugs.length) {
      throw new NotFoundException(
        'Berilgan permissionlardan ba’zilari topilmadi.',
      );
    }

    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    await this.prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
    });

    return this.findOne(roleId);
  }
}
