//const fetch = require('node-fetch');
const pup = require('puppeteer');
const url = 'https://www.chiccousa.com/shop-our-products/car-seats/infant/';

(async function scrape() {
  const timer = 100
  const browser = await pup.launch(/*{ headless: false }*/)
  const page = await browser.newPage();
  console.log('Scraping ' + url)
  await page.goto(url);
  await page.waitForTimeout(timer)
    .then(() => page.mouse.wheel({ deltaY: 500 })
      .then(() => page.waitForTimeout(timer)
        .then(() => page.mouse.wheel({ deltaY: 2000 })))
      .then(() => page.waitForTimeout(timer)
        .then(() => page.mouse.wheel({ deltaY: 1000 })))
      .then(() => page.waitForTimeout(timer)
        .then(() => page.mouse.wheel({ deltaY: 3000 })))
        .then(() => page.waitForTimeout(timer*2)));

  let prods = await page.evaluate(() => {
    let items = document.body.querySelectorAll('div.product-name')
    return items;

  })
  console.log(prods)
  await browser.close()

})();