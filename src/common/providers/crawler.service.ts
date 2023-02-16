import { Injectable, Scope } from '@nestjs/common';
import * as randomUseragent from 'random-useragent';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page, executablePath } from 'puppeteer';

export type PageHandler = (page: Page) => Promise<any>;

@Injectable({ scope: Scope.DEFAULT })
export class CrawlerService {
  constructor() {
    puppeteer.use(StealthPlugin());
  }
  async navigatePage(
    browser: Browser,
    pageUrl: string,
    handler: PageHandler,
    waitElement: string = null,
  ): Promise<void> {
    //  CAPTCHA avoidance
    const ua = randomUseragent.getRandom();
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 3000 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: true,
      isLandscape: true,
      isMobile: false,
    });

    // increase timeout
    await page.setDefaultTimeout(12400);

    //  navigate
    await page.goto(pageUrl);

    //  intentional delay
    await new Promise((resolve) => setTimeout(resolve, 1456));

    if (waitElement) await page.waitForSelector(waitElement);

    try {
      await handler(page);
    } catch (ex) {
      console.error(ex);
    } finally {
      await page.close();
    }
  }

  async launchBrowser(
    launchCallback: (browser: Browser) => Promise<void>,
  ): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      executablePath: executablePath(),
    });
    try {
      await launchCallback(browser);
    } finally {
      await browser.close();
    }
  }
}
