const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173/?tab=calendar');
  
  // Wait a bit to let it render and catch errors
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
