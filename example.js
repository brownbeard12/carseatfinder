require('dotenv').config()
const faunadb = require('faunadb')
const q = faunadb.query
const pup = require('puppeteer');

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
const main_url = 'https://www.chiccousa.com/shop-our-products/car-seats/infant/';
const brand_name = 'Chicco';
let bprods = [];

//Call scrape + query
(async () => {
  await scrape(main_url, brand_name);
  console.log(bprods)
  for (prod of bprods) {
    client.query(
      q.Create(
        q.Collection('car_seats'),
        { data: prod }
      )
    )
      .catch((err) => console.log(err))
  }
})()


//Scrape function
async function scrape(url, brand) {
  const timer = 500
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
      .then(() => page.waitForTimeout(timer * 1.5)
        .then(() => page.mouse.wheel({ deltaY: 2000 })))
      .then(() => page.waitForTimeout(timer * 2)));

  let prods = await page.evaluate(() => {
    let items = document.body.querySelectorAll('div.product-name')
    let _items = Object.values(items).map(em => {
      return {
        name: em.textContent.trim(),
        brand: brand,
      }
    })
    return _items;
  })

  bprods = prods
  await browser.close()
  return prods;
};

