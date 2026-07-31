import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id!: string;

  email!: string;

  name!: string;

  phone!: string | null;

  avatar!: string | null;

  role!: UserRole;

  isActive!: boolean;

  createdAt!: Date;
}
