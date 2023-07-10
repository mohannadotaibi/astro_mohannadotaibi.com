/// <reference types="@astrojs/image/client" />
import cheerio from 'cheerio';

declare global {
  const cheerio: CheerioAPI;
}
