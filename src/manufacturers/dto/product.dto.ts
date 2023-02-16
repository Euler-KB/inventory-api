import {
  KeyValueList,
  KeyValuePair,
} from '../../database/interfaces/key-value.list';
import { ApiProperty } from '@nestjs/swagger';

class StringKeyPair {
  @ApiProperty()
  key: string;
  @ApiProperty()
  value: string;
}

export class ProductDto {
  @ApiProperty({ description: 'A unique product id' })
  id: string;

  @ApiProperty({ isArray: true, type: [StringKeyPair] })
  properties: StringKeyPair[];

  @ApiProperty({ description: 'Indicates the date product was created' })
  dateCreated: Date;
}
