// Usage: node threads_search.js out.jsonl "kw1" "kw2" ...
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, ...kws] = process.argv.slice(2);
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ locale: 'vi-VN', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
  const seen = new Set();
  for (const kw of kws) {
    for (const type of ['default']) {
      const p = await ctx.newPage();
      const url = `https://www.threads.com/search?q=${encodeURIComponent(kw)}&serp_type=${type}${type==='recent'?'&filter=recent':''}`;
      let n = 0;
      try {
        await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await p.waitForTimeout(5000);
        for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 4000); await p.waitForTimeout(1500); }
        const posts = await p.evaluate(() => {
          const res = [];
          document.querySelectorAll('div[data-pressable-container="true"]').forEach(el => {
            const a = el.querySelector('a[href*="/post/"]');
            const t = el.querySelector('time');
            res.push({ url: a ? a.href : null, time: t ? t.getAttribute('datetime') : null, text: el.innerText });
          });
          return res;
        });
        for (const x of posts) {
          const key = x.url || x.text.slice(0, 120);
          if (seen.has(key)) continue;
          seen.add(key); n++;
          fs.appendFileSync(out, JSON.stringify({ kw, type, ...x }) + '\n');
        }
      } catch (e) { console.error('ERR', kw, type, e.message); }
      console.error(`${kw} [${type}] +${n}`);
      await p.close();
    }
  }
  await b.close();
})();
