import { Injectable, Scope } from '@nestjs/common';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { CrawlerService } from './crawler.service';
import { ConfigService } from '@nestjs/config';
import { Product } from '../../database/entities/product.entity';
import { ProductCrawlerRecord } from '../interfaces/product.crawler.record';
import { KeyValueList } from '../../database/interfaces/key-value.list';
import { CrawlerRecord } from '../interfaces/crawler.record';
import * as puppeteer from 'puppeteer';
import { CrawlAction } from '../interfaces/crawl.action';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
export type CrawlerJobType = 'products' | 'spec';
export type JobStatus = 'completed' | 'running' | 'faulted';

interface CrawlerJobData {
  type: CrawlerJobType;
  product?: {
    manufacturerId: string;
    website: string;
    query: ProductCrawlerRecord;
  };
  specification?: {
    productId: string;
  };
}

interface CompleteHandler {
  products: (manufacturerId: string, products: Partial<Product>[]) => void;
  spec: (productId: string, specifications: KeyValueList<string[]>) => void;
}

@Injectable({ scope: Scope.DEFAULT })
export class BackgroundService {
  private queue: Queue;
  private worker: Worker<CrawlerJobData, any>;
  private readonly connection: IORedis;
  private readonly queueEvents: QueueEvents;

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.connection = new IORedis({
      host: config.get<string>('REDIS_HOST') || 'redis',
      port: config.get<number>('REDIS_PORT') || 6379,
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue('Crawler', { connection: this.connection });
    this.worker = new Worker<CrawlerJobData, any>(
      'Crawler',
      this.runCrawler.bind(this),
      {
        connection: this.connection,
      },
    );
    this.queueEvents = new QueueEvents('Crawler', {
      connection: this.connection,
    });
  }

  async cleanAllJobs() {
    for (const state of [
      'completed',
      'wait',
      'active',
      'paused',
      'delayed',
      'failed',
    ] as const)
      await this.queue.clean(1000, 256, state);
  }

  handleEventCompleted<T extends CrawlerJobType>(
    type: T,
    callback: CompleteHandler[T],
  ) {
    this.queueEvents.on('completed', async ({ jobId, returnvalue }) => {
      const job = await Job.fromId<CrawlerJobData>(this.queue, jobId);
      if (job.data.type === type && type === 'products') {
        callback(job.data.product.manufacturerId, JSON.parse(returnvalue));
      } else if (job.data.type === type && type === 'spec') {
        callback(job.data.specification.productId, JSON.parse(returnvalue));
      }
    });
  }

  async addProductsJob(options: CrawlerJobData['product']): Promise<string> {
    const jobData: CrawlerJobData = { type: 'products', product: options };
    return await this.createNewJob('crawl-products-job', jobData);
  }

  async addSpecificationJob(options: CrawlerJobData['specification']) {
    const jobData: CrawlerJobData = { type: 'spec', specification: options };
    return await this.createNewJob('craw-specifications-job', jobData);
  }

  private async createNewJob(
    name: string,
    jobData: CrawlerJobData,
  ): Promise<string> {
    const { id } = await this.queue.add(name, jobData, {
      removeOnComplete: false,
    });
    return <string>id;
  }

  private async extractCrawlerRecords(
    tab: puppeteer.Page,
    records: CrawlerRecord[],
  ): Promise<KeyValueList<string[]>> {
    const properties: KeyValueList<string[]> = [];
    for (const field of records) {
      const values = [];
      const selectQuery = await tab.$$(
        Array.isArray(field.selector)
          ? <string>field.selector[0]
          : field.selector,
      );
      const list = Array.isArray(field.selector)
        ? [selectQuery[<number>field.selector[1]]]
        : selectQuery;
      for (const item of list) {
        const node = await item.getProperty('textContent');
        values.push(await node.jsonValue());
      }
      properties.push({
        key: field.key,
        value: values,
      });
    }

    return properties;
  }

  private async processProductsCrawler({
    product,
  }: CrawlerJobData): Promise<string> {
    let products: Partial<Product>[] = [];
    await this.crawlerService.launchBrowser(async (browser) => {
      for (const page of product.query.pages) {
        const url = page.url || product.website;
        await this.crawlerService.navigatePage(browser, url, async (tab) => {
          const properties = await this.extractCrawlerRecords(tab, page.fields);
          products = products.concat(
            properties[0].value.map((value, index) => {
              return {
                properties: properties.map((x, k) => ({
                  key: x.key,
                  value: properties[k].value[index],
                })),
                meta: {
                  ...page.specMeta,
                  url,
                  productSelector: page.productSelector,
                  productSelectorIndex: index,
                },
              };
            }),
          );
        });
      }
    });
    return JSON.stringify(products);
  }

  private async runCrawlActions(page: puppeteer.Page, actions: CrawlAction[]) {
    for (const action of actions) {
      const selectors = [].concat(action.selector);
      if (action.type === 'click') {
        for (const selector of selectors) {
          const element = await page.waitForSelector(selector);
          if (element) await element.click();
        }
      } else if (action.type == 'waitSelector') {
        for (const selector of selectors) await page.waitForSelector(selector);
      } else if (action.type == 'waitDocumentLoad') {
        await page.waitForNavigation({
          waitUntil: 'domcontentloaded',
        });
      } else if (action.type == 'delay') {
        if (action.delay) {
          await new Promise((resolve) => setTimeout(resolve, action.delay));
        }
      } else if (action.type == 'autoscroll') {
        await page.evaluate(`async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if (totalHeight >= scrollHeight - window.innerHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        }`);
      }
    }
  }

  private async processSpecificationCrawler({
    specification,
  }: CrawlerJobData): Promise<string> {
    let results: KeyValueList<string[]> = [];
    const productsRepository = this.dataSource.getRepository(Product);
    const product = await productsRepository.findOne({
      where: { id: specification.productId },
    });

    await this.crawlerService.launchBrowser(async (browser) => {
      const meta = product.meta;
      const url = meta.url;
      await this.crawlerService.navigatePage(browser, url, async (page) => {
        //  run crawler actions
        if (meta.actions) {
          await this.runCrawlActions(
            page,
            meta.actions.filter((x) => !x.stage || x.stage === 'before'),
          );
        }

        //  select product
        if (meta.productSelector && 'productSelectorIndex' in meta) {
          const element = (await page.$$(meta.productSelector))[
            meta.productSelectorIndex
          ];
          if (element) {
            await element.click();
            await page.waitForSelector('body');
          }
        }

        if (meta.actions) {
          await this.runCrawlActions(
            page,
            meta.actions.filter((x) => x.stage === 'after'),
          );
        }

        const specItems = await this.extractCrawlerRecords(
          page,
          meta.selectors,
        );

        results = results.concat(specItems);
      });
    });
    return JSON.stringify(results);
  }

  private async runCrawler(job: Job<CrawlerJobData>) {
    const { data } = job;
    let result: string = null;
    if (data.type === 'products') {
      result = await this.processProductsCrawler(data);
    } else if (data.type === 'spec') {
      result = await this.processSpecificationCrawler(data);
    }
    return result;
  }

  async getJobStatus(id: string): Promise<JobStatus | null> {
    const job = await this.queue.getJob(id);
    if (!job) return null;

    if (await job.isFailed()) return 'faulted';
    if (await job.isCompleted()) return 'completed';
    return 'running';
  }

  async getJobResult<T>(id: string, wait: boolean): Promise<T> {
    const job = await this.queue.getJob(id);
    if (wait) {
      await job.waitUntilFinished(this.queueEvents);
    }
    return job.returnvalue as T;
  }
}
