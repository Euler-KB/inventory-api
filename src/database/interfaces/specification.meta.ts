import { CrawlerRecord } from '../../common/interfaces/crawler.record';
import { CrawlAction } from '../../common/interfaces/crawl.action';

export interface CreateSpecificationMetadata {
  actions: CrawlAction[]; // actions to execute
  selectors: CrawlerRecord[]; // selectors for page
}

export interface SpecificationMetadata extends CreateSpecificationMetadata {
  url?: string;
  productSelector?: string; // The selector for the product
  productSelectorIndex?: number; // The index for selection
}
