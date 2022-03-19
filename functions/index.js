const functions = require("firebase-functions");

// ------- Chicco ----------
exports.chicco = functions.https.onRequest((request, response) => {

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
  const main_url = 'https://www.chiccousa.com/';
  const cat_url = ['shop-our-products/car-seats/infant/', 'harness-booster-seats/', 'shop-our-products/car-seats/all-in-one/', 'shop-our-products/car-seats/convertible/', 'shop-our-products/car-seats/booster/']
  const brand_name = 'Chicco';
  const status = 'active';

  //Call scrape + query
  (async () => {
    for (let i = 0; i < cat_url.length; i++) {
      let search_url = main_url + cat_url[i];
      let prod_list = await scrape(search_url);
      for (prod of prod_list) {
        prod.brand = brand_name;
        prod.status = status;
        prod.timestamp = Date.now();
      }
      utils.addOrUpdate(client, q, prod_list);
    }
  })()
    .then(() => response.send("Complete!"));

  //Scrape function
  async function scrape(url) {
    const timer = 500
    const browser = await pup.launch({ headless: true, args: ['--no-sandbox'] })
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
      let items = document.body.querySelectorAll('div.product-tile')
      let _items = Object.values(items).map(em => {
        let item_json = JSON.parse(em.querySelector('div.product-image').querySelector('a').getAttribute('data-gtmdata'));
        return {
          item_id: item_json['dimension7'],
          prod_id: item_json['id'],
          name: item_json['name'],
          category: item_json['category'],
          prod_url: em.querySelector('div.product-image').querySelector('a').getAttribute('href'),
          img_url: em.querySelector('div.product-image').querySelector('a').querySelector('img').getAttribute('src'),
          price: item_json['price']
        }
      })
      return _items;
    })

    await browser.close()
    return prods;
  };

});
// -----------------------------------------------------------------------

// ------- Diono ----------
exports.diono = functions.https.onRequest((request, response) => {

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
  const main_url = 'https://store.diono.com/car-seats/';
  const cat_url = ['all-in-one-convertibles/', 'boosters/']
  const brand_name = 'Diono';
  const prod_status = 'active';

  //Call scrape + query
  (async () => {
    for (let i = 0; i < cat_url.length; i++) {
      let search_url = main_url + cat_url[i];
      let prod_list = await scrape(search_url);
      for (prod of prod_list) {
        prod.brand = brand_name;
        prod.status = prod_status;
        prod.timestamp = Date.now();
      }
      utils.addOrUpdate(client, q, prod_list);
    }
  })()
    .then(() => response.send("Complete!"));

  //Scrape function
  async function scrape(url) {
    const timer = 200
    const browser = await pup.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage();
    console.log('Scraping ' + url)
    await page.goto(url);
    await page.waitForTimeout(timer)

    let prods = await page.evaluate(() => {
      let items = document.body.querySelectorAll('article.product-card')
      let _items = Object.values(items).map(em => {
        let item_json = JSON.parse(em.querySelector('div.product-card__figure').querySelector('a.product-card__image').getAttribute('data-analytics-sent'));
        return {
          item_id: item_json['name'],
          prod_id: item_json['product_id'],
          name: item_json['name'],
          category: item_json['category'],
          prod_url: em.querySelector('div.product-card__figure').querySelector('a.product-card__image').getAttribute('href'),
          img_url: em.querySelector('div.product-card__figure').querySelector('a.product-card__image').querySelector('img').getAttribute('src'),
          price: item_json['price']
        }
      })
      return _items;
    })

    await browser.close()
    return prods;
  };
});
// -----------------------------------------------------------------------

// ------- Cosco ----------
exports.cosco = functions.https.onRequest((request, response) => {
  require('dotenv').config()
  const faunadb = require('faunadb')
  const q = faunadb.query
  const utils = require('./utils.js')
  const fetch = require('cross-fetch');
  const { JSDOM } = require('jsdom');

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
  const main_url = 'https://www.coscokids.com/products/car-seats.html';
  const brand_name = 'Cosco';
  const status = 'active';

  //Call scrape + query
  (async () => {
    let search_url = main_url;
    let prod_list = await scrape(search_url);
    for (prod of prod_list) {
      prod.brand = brand_name;
      prod.status = status;
      prod.timestamp = Date.now();
    }
    utils.addOrUpdate(client, q, prod_list);
  })()
    .then(() => response.send("Complete!"));

  //Scrape function
  async function scrape(url) {
    const response = await fetch(url).then(response => response.text()).then(data => {

      const doc = new JSDOM(data);

      const items = doc.window.document.querySelectorAll("li.product-item");

      let _items = Object.values(items).map(em => {
        return {
          prod_url: em.querySelector('a.product-item-link').getAttribute('href'),
          prod_id: em.querySelector('div.price-box').getAttribute('data-product-id'),
          item_id: "cosco-" + em.querySelector('div.price-box').getAttribute('data-product-id'),
          name: em.querySelector('img.product-image-photo').getAttribute('alt'),
          // category: 
          img_url: em.querySelector('img.product-image-photo').getAttribute('src'),
          price: em.querySelector('div.price-box').querySelector('span.price-wrapper').getAttribute('data-price-amount'),
        }
      })

      return _items;
    });
    return response;
  };
});
// -----------------------------------------------------------------------

// ------- Graco ----------
exports.graco = functions.runWith({ memory: '2GB' }).https.onRequest((request, response) => {
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
      // console.log(prod_list);
      utils.addOrUpdate(client, q, prod_list);
    }
  })()
    .then(() => response.send("Complete!"));

  //Scrape function
  async function scrape(url) {
    const timer = 200;
    const browser = await pup.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
    console.log('Scraping ' + url)
    await page.goto(url, {
      waitUntil: 'load',
      timeout: 0,
    });
    await page.waitForTimeout(timer);
    await page.keyboard.press('Escape');

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
});