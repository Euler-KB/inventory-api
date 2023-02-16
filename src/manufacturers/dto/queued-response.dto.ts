import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from './product.dto';
import {
  KeyValueList,
  KeyValuePair,
} from '../../database/interfaces/key-value.list';

class QueuedResponseBase {
  @ApiProperty({
    description:
      'ID background job. Property only exists if job is still in progress',
  })
  jobId?: string | undefined;
}

export class ProductsResponse extends QueuedResponseBase {
  @ApiProperty({
    description: 'Contains products payload',
    isArray: true,
    type: [ProductDto],
  })
  data: ProductDto[];
}

export class SpecificationResponse extends QueuedResponseBase {
  @ApiProperty({
    description: 'Contains list of properties extract for product',
    isArray: true,
    type: [KeyValuePair<string[]>],
  })
  data: KeyValueList<string[]>;
}
