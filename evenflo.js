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
const main_url = 'https://www.evenflo.com';
const cat_url = ['/collections/infant-car-seats', '/collections/convertible-car-seats', '/collections/booster-car-seats']
const cat = ['Infant', 'Convertible', 'Booster']
const brand_name = 'Evenflo';
const prod_status = 'active';

//Call scrape + query
(async () => {
  for (let i = 0; i < cat_url.length; i++) {
    let search_url = main_url + cat_url[i];
    let prod_list = await scrape(search_url);
    for (prod of prod_list) {
      prod.brand = brand_name;
      prod.category = cat[i];
      prod.status = prod_status;
      prod.timestamp = Date.now();
    }
    // console.log(prod_list)
    utils.addOrUpdate(client, q, prod_list);
  }
})();

//Scrape function
async function scrape(url) {
  const timer = 100
  const browser = await pup.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
  console.log('Scraping ' + url)
  await page.goto(url);
  await page.waitForTimeout(timer);
  await page.waitForSelector('div.quick-shop-style--popup');

  let prods = await page.evaluate(() => {
    let items = document.body.querySelectorAll('div.quick-shop-style--popup')
    let _items = Object.values(items).map(em => {
      let item_price = em.querySelector('div.product-details').querySelector('span.current_price').textContent.trim();
      let split_pos = item_price.search(/\$/);
      
      return {
        //item_id: 'evenflo-' + em.querySelector('div.info').querySelector('span').getAttribute('data-id'),
        //prod_id: em.querySelector('div.info').querySelector('span').getAttribute('data-id'),
        name: em.querySelector('div.image-element__wrap').querySelector('img').getAttribute('alt'),
        prod_url: 'https://www.evenflo.com' + em.querySelector('a.product-info__caption').getAttribute('href'),
        img_url: em.querySelector('div.image-element__wrap').querySelector('img').getAttribute('src'),
        price: item_price.slice(split_pos),
      }
    })
    return _items;
  })

  await browser.close()
  return prods;
};