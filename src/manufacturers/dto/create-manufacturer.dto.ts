import { ProductCrawlerRecord } from '../../common/interfaces/product.crawler.record';
import { ApiProperty } from '@nestjs/swagger';

export class CreateManufacturerDto {
  @ApiProperty({ description: 'Name of manufacturer' })
  name: string;

  @ApiProperty({ description: "Manufacturer's website" })
  website: string;

  @ApiProperty({ description: 'Crawler specification for manufacturer' })
  crawlerSpec: {
    product: ProductCrawlerRecord;
  };
}
