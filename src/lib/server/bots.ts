import 'server-only';

/**
 * Small server-side UA test used by /api/track. Not exhaustive (no `isbot`
 * dependency on purpose, to keep package.json untouched): crawlers, link
 * previewers, HTTP libraries and headless automation are dropped. A missing UA
 * is always treated as a bot.
 */
const BOT_RE =
  /(?<!cu)bot|crawl|spider|slurp|fetch|scrap|preview|monitor|uptime|lighthouse|pagespeed|gtmetrix|facebookexternalhit|whatsapp|telegram|discord|slack-imgproxy|skype|embedly|quora|vkshare|headless|phantomjs|puppeteer|playwright|selenium|webdriver|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|undici|libwww|httpclient|postman|insomnia|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baidu-|duckduckgo-favicons|applebot|vercel|google-inspectiontool|googleother|mediapartners-google|apis-google|qwantify|iframely|ia_archiver|newrelicpinger|google-read-aloud|netcraftsurveyagent/i;

/**
 * Real people that a naive substring match flags as bots (regression table in scripts/test-bots.test.mjs):
 * Cubot phones ("cuBOT"), the Pinterest / DuckDuckGo / Baidu / Slack in-app browsers. Their crawlers stay
 * caught by their own tokens (Pinterestbot, DuckDuckBot, Baiduspider, Slackbot all contain bot / spider).
 */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.length < 8 || ua.length > 512) return true;
  return BOT_RE.test(ua);
}
