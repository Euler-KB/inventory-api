export interface CrawlAction {
  type: 'click' | 'delay' | 'waitSelector' | 'waitDocumentLoad' | 'autoscroll';
  selector?: string | string[];
  delay?: number;
  stage?: 'before' | 'after';
}
