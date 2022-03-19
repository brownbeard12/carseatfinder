require('dotenv').config()
const faunadb = require('faunadb')
const q = faunadb.query
const pup = require('puppeteer');
const utils = require('./utils.js')

//Setup Fauna
const secret = process.env.FAUNADB_SECRET
let endpoint = process.env.FAUNADB_ENDPOINT

if (typeof secret === 'undefined' || secret === '') {
  console.error('key not set')
  process.exit(1)
}

if (!endpoint) endpoint = 'https://db.us.fauna.com'

let mg, domain, port, scheme
if ((mg = endpoint.match(/^(https?):\/\/([^:]+)(:(\d+))?/))) {
  scheme = mg[1] || 'https'
  domain = mg[2] || 'db.us.fauna.com'
  port = mg[4] || 443
}

const client = new faunadb.Client({
  secret: secret,
  domain: domain,
  port: port,
  scheme: scheme,
})

//Setup scrape
const main_url = 'https://www.gracobaby.com';
const cat_url = ['/car-seats/infant-car-seats/', '/car-seats/toddler-car-seats/convertible-car-seats/', '/car-seats/toddler-car-seats/all-in-one-car-seats/', '/car-seats/booster-car-seats/']
const cat = ['Infant', 'Convertible', 'All-in-One', 'Booster']
const brand_name = 'Graco';
const prod_status = 'active';

//Call scrape + query
(async () => {
  for (let i = 0; i < cat_url.length; i++) {
    let search_url = main_url + cat_url[i];
    let prod_list = await scrape(search_url);
    for (prod of prod_list) {
      prod.brand = brand_name;
      prod.status = prod_status;
      prod.category = cat[i];
      prod.timestamp = Date.now();
    }
    console.log(prod_list);
    // utils.addOrUpdate(client, q, prod_list);
  }
})()
// .then(() => response.send("Complete!"));

//Scrape function
async function scrape(url) {
  const timer = 100;
  const browser = await pup.launch({ headless: true, args: ['--no-sandbox'] })
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
  console.log('Scraping ' + url)
  await page.goto(url, {
    waitUntil: 'load',
    timeout: 0,
  });
  await page.waitForTimeout(timer);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(timer);

  let prods = await page.evaluate(() => {
    let items = document.body.querySelectorAll('div.product-tile');
    let _items = Object.values(items).map(em => {
      let item_json = JSON.parse(em.getAttribute('data-analytics-data'));
      let item_url = em.querySelector('a.product-tile-link').getAttribute('href');
      item_url = 'https://www.gracobaby.com' + item_url;
      return {
        prod_url: item_url,
        prod_id: item_json['product_sku'],
        item_id: item_json['id'],
        name: item_json['name'],
        img_url: em.querySelector('img.tile-image').getAttribute('src'),
        price: item_json['price'],
      }

    })
    return _items;
  });
  await browser.close()
  return prods;
}
