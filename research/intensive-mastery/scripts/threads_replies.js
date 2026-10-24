// Usage: node threads_replies.js in.jsonl out.jsonl
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [inp, out] = process.argv.slice(2);
  const done = new Set(fs.existsSync(out) ? fs.readFileSync(out,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).post) : []);
  const urls = [...new Set(fs.readFileSync(inp,'utf8').trim().split('\n').map(l=>JSON.parse(l).url).filter(Boolean).map(u=>u.replace(/\/media$/,'')))].filter(u=>!done.has(u));
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ locale: 'vi-VN', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
  for (const url of urls) {
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await p.waitForTimeout(4000);
      for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, 4000); await p.waitForTimeout(1200); }
      const items = await p.evaluate(() => [...document.querySelectorAll('div[data-pressable-container="true"]')].map(el => {
        const a = el.querySelector('a[href*="/post/"]'); const t = el.querySelector('time');
        return { url: a ? a.href : null, time: t ? t.getAttribute('datetime') : null, text: el.innerText };
      }));
      fs.appendFileSync(out, JSON.stringify({ post: url, items }) + '\n');
      console.error(url, items.length);
    } catch (e) { console.error('ERR', url, e.message); }
    await p.close();
  }
  await b.close();
})();
