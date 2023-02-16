import { Module } from '@nestjs/common';
import { CrawlerService } from './providers/crawler.service';
import { BackgroundService } from './providers/background.service';

@Module({
  providers: [CrawlerService, BackgroundService],
  exports: [CrawlerService, BackgroundService],
})
export class CommonModule {}
