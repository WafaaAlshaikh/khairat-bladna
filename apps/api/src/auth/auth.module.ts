import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy],

  exports: [JwtModule],
})
export class AuthModule {}
