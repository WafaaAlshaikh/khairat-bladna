import { UserResponseDto } from '../../common/dto/user-response.dto';

export class AuthResponseDto {
  accessToken!: string;

  refreshToken!: string;

  user!: UserResponseDto;
}
