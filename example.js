//const fetch = require('node-fetch');
const pup = require('puppeteer');

(async function scrape() {
  const browser = await pup.launch({ headless: false })
  const page = await browser.newPage();
  page.goto('https://www.chiccousa.com/shop-our-products/car-seats/infant/');
  page.waitForTimeout(500)
    .then(() => page.mouse.wheel({ deltaY: 500 })
      .then(() => page.waitForTimeout(500)
        .then(() => page.mouse.wheel({ deltaY: 2000 })))
      .then(() => page.waitForTimeout(500)
        .then(() => page.mouse.wheel({ deltaY: 1000 })))
      .then(() => page.waitForTimeout(500)
        .then(() => page.mouse.wheel({ deltaY: 2000 }))));

})();