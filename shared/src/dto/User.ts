import { ApiProperty } from '@nestjs/swagger';

export class User {
  id: number;

  @ApiProperty()
  name: string;
}
