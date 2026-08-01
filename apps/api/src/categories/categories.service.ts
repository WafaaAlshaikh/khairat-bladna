import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';

import { Prisma } from '@prisma/client';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);

    await this.validateUniqueCategory({
      name: dto.name,
      slug,
    });

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
      },
    });
  }

  async findAll(query: QueryCategoryDto) {
    const { search, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
      isActive: true,

      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            slug: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,

        skip,

        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.category.count({
        where,
      }),
    ]);

    return {
      data,

      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.findCategoryOrThrow(id);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findCategoryOrThrow(id);

    let slug = category.slug;

    if (dto.name) {
      slug = this.generateSlug(dto.name);

      await this.validateUniqueCategory(
        {
          name: dto.name,
          slug,
        },
        id,
      );
    }

    return this.prisma.category.update({
      where: {
        id,
      },

      data: {
        ...dto,
        slug,
      },
    });
  }

  async remove(id: string) {
    await this.findCategoryOrThrow(id);

    return this.prisma.category.update({
      where: {
        id,
      },

      data: {
        isActive: false,
      },
    });
  }

  private async findCategoryOrThrow(id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async validateUniqueCategory(
    data: {
      name?: string;
      slug?: string;
    },
    excludeId?: string,
  ) {
    const existing = await this.prisma.category.findFirst({
      where: {
        ...(excludeId && {
          NOT: {
            id: excludeId,
          },
        }),

        OR: [
          ...(data.name ? [{ name: data.name }] : []),

          ...(data.slug ? [{ slug: data.slug }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Category already exists');
    }
  }

  private generateSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
