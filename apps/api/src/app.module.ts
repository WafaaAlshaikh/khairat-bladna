import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';

import { validateEnv } from './common/config/env.validation';
import jwtConfig from './common/config/jwt.config';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [jwtConfig],
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
  ],
})
export class AppModule {}
