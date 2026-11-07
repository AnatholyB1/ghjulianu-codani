// node --test --conditions=react-server --import ./scripts/ts-register.mjs scripts/test-bots.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const { isBotUserAgent } = await import('../src/lib/server/bots.ts');

const HUMANS = {
  'Pinterest in-app (iOS)': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]',
  'DuckDuckGo mobile browser': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 DuckDuckGo/5',
  'Baidu app': 'Mozilla/5.0 (Linux; Android 13; V2227A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36 baiduboxapp/13.50.0.10 (Baidu; P1 13)',
  'Cubot phone': 'Mozilla/5.0 (Linux; Android 12; CUBOT_X70) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Cubot phone (lowercase)': 'Mozilla/5.0 (Linux; Android 11; cubot_p40) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Slack in-app (iOS)': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Slack/24.03.20 SlackWebView',
  'Chrome desktop': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Safari iPhone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Firefox Linux': 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
};

const BOTS = {
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  ahrefs: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  semrush: 'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
  headless: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0.0.0 Safari/537.36',
  curl: 'curl/8.4.0',
  'python-requests': 'python-requests/2.31.0',
  Pinterestbot: 'Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)',
  Pinterest_crawler: 'Pinterest/0.2 (+http://www.pinterest.com/bot.html)',
  DuckDuckBot: 'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
  'DuckDuckGo favicons': 'Mozilla/5.0 (compatible; DuckDuckGo-Favicons-Bot/1.0; +http://duckduckgo.com)',
  Baiduspider: 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
  Slackbot: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  Slack_imgproxy: 'Slack-ImgProxy (+https://api.slack.com/robots)',
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  whatsapp: 'WhatsApp/2.23.20.0',
  puppeteer: 'Mozilla/5.0 Puppeteer',
  'no UA': '',
};

test('real visitors are NOT bots', () => {
  for (const [name, ua] of Object.entries(HUMANS)) assert.equal(isBotUserAgent(ua), false, name);
});

test('crawlers, previewers, libraries and headless ARE bots', () => {
  for (const [name, ua] of Object.entries(BOTS)) assert.equal(isBotUserAgent(ua), true, name);
  assert.equal(isBotUserAgent(null), true);
  assert.equal(isBotUserAgent(undefined), true);
});
