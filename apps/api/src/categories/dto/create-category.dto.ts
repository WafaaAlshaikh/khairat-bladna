import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Olive Oil',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'Premium Palestinian olive oil',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'https://image.com/category.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
