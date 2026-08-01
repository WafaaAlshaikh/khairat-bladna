import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'ahmad@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '12345678',
    description: 'User password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'Ahmad Khalil',
    description: 'Full name of the user',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: '+970599123456',
    description: 'Optional phone number',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
