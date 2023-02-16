import { ApiProperty } from '@nestjs/swagger';

export class JobStatusDto {
  @ApiProperty({ description: 'JobStatus' })
  status: string;
}
