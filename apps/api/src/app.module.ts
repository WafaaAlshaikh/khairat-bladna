import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

import { validateEnv } from './common/config/env.validation';
import { CategoriesModule } from './categories/categories.module';
import jwtConfig from './common/config/jwt.config';

@Module({
  imports: [
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
