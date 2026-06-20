const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER NETWORK ERROR:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  const token = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin1@reqwise.com', password: 'password123' })
    });
    const data = await res.json();
    return data.token;
  });

  await page.evaluate((t) => {
    localStorage.setItem('reqwise_token', t);
  }, token);
  
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();
