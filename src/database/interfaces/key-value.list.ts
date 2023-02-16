import { ApiProperty } from '@nestjs/swagger';

export class KeyValuePair<TValue> {
  @ApiProperty()
  key: string;

  @ApiProperty()
  value: TValue;
}

export type KeyValueList<TValue> = KeyValuePair<TValue>[];
