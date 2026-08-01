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
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

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
    private configService: ConfigService,
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
        phone: dto.phone,
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

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
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
    let refreshTokenId: string;
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        dto.refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );
      refreshTokenId = payload.jti;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        id: refreshTokenId,
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

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const isValid = await bcrypt.compare(dto.refreshToken, storedToken.token);
    if (!isValid) {
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
    let refreshTokenId: string;
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        dto.refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );
      refreshTokenId = payload.jti;
    } catch {
      return {
        message: 'Logged out successfully',
      };
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        id: refreshTokenId,
      },
    });

    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return {
      message: 'Logged out successfully',
    };
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out from all devices successfully',
    };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: User['role'];
  }) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenId = randomUUID();

    const refreshPayload = {
      sub: user.id,
      jti: refreshTokenId,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload);

    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpires =
      this.configService.get<string>('jwt.refreshExpires') || '30d';

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpires,
    } as any);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const days = parseInt(refreshExpires.replace('d', '')) || 30;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days);

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt,
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
