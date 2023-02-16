import { CrawlerRecord } from './crawler.record';
import { CreateSpecificationMetadata } from '../../database/interfaces/specification.meta';

export interface ProductPage {
  url: string;
  productSelector: string;
  specMeta: CreateSpecificationMetadata;
  fields: CrawlerRecord[];
}

export interface ProductCrawlerRecord {
  pages: ProductPage[];
}
