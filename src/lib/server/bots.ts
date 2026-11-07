import 'server-only';

/**
 * Small server-side UA test used by /api/track. Not exhaustive (no `isbot`
 * dependency on purpose, to keep package.json untouched): crawlers, link
 * previewers, HTTP libraries and headless automation are dropped. A missing UA
 * is always treated as a bot.
 */
const BOT_RE =
  /bot|crawl|spider|slurp|fetch|scrap|preview|monitor|uptime|lighthouse|pagespeed|gtmetrix|facebookexternalhit|whatsapp|telegram|discord|slack|skype|embedly|quora|pinterest|vkshare|headless|phantomjs|puppeteer|playwright|selenium|webdriver|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|undici|libwww|httpclient|postman|insomnia|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baidu|duckduck|applebot|vercel/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.length < 8 || ua.length > 512) return true;
  return BOT_RE.test(ua);
}
