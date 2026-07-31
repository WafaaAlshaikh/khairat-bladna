import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../common/prisma/prisma.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';

type UserResponse = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: User['role'];
  isActive: boolean;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },

      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,

      user: this.mapUserResponse(user),
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,

        expiresAt: {
          gt: new Date(),
        },
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    let storedToken: (typeof tokens)[number] | null = null;

    for (const token of tokens) {
      const isValid = await bcrypt.compare(dto.refreshToken, token.token);

      if (isValid) {
        storedToken = token;

        break;
      }
    }

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },

      data: {
        revokedAt: new Date(),
      },
    });

    return this.generateTokens(storedToken.user);
  }

  async logout(dto: RefreshTokenDto) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
      },
    });

    for (const token of tokens) {
      const isValid = await bcrypt.compare(dto.refreshToken, token.token);

      if (isValid) {
        await this.prisma.refreshToken.update({
          where: {
            id: token.id,
          },

          data: {
            revokedAt: new Date(),
          },
        });

        break;
      }
    }

    return {
      message: 'Logged out successfully',
    };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: User['role'];
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = randomUUID();

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,

        userId: user.id,

        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private mapUserResponse(user: User): UserResponse {
    return {
      id: user.id,

      email: user.email,

      name: user.name,

      phone: user.phone,

      avatar: user.avatar,

      role: user.role,

      isActive: user.isActive,

      createdAt: user.createdAt,
    };
  }
}
