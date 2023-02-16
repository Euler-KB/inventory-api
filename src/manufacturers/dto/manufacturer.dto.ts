import { ApiProperty } from '@nestjs/swagger';

export class ManufacturerDto {
  @ApiProperty({ description: 'A unique manufacturer id' })
  id: string;

  @ApiProperty({ description: 'Name of manufacturer' })
  name: string;

  @ApiProperty({ description: 'Website of manufacturer' })
  website: string;

  @ApiProperty({ description: 'Indicates date manufacturer was created' })
  dateCreated: Date;
}
