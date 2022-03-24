const functions = require("firebase-functions");

// ------- Chicco ----------
exports.chicco = functions.https.onRequest((request, response) => {

  require('dotenv').config()
  const faunadb = require('faunadb')
  const q = faunadb.query
  const chromium = require('chrome-aws-lambda');
  const puppeteer = require('puppeteer-core');
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
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
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
  const chromium = require('chrome-aws-lambda');
  const puppeteer = require('puppeteer-core');
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
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
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
  const chromium = require('chrome-aws-lambda');
  const puppeteer = require('puppeteer-core');
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
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
    console.log('Scraping ' + url)
    await page.goto(url);
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
});

//-------------------------------

// ------- Britax ----------
exports.britax = functions.runWith({ memory: '2GB' }).https.onRequest((request, response) => {

  require('dotenv').config()
  const faunadb = require('faunadb')
  const q = faunadb.query
  const chromium = require('chrome-aws-lambda');
  const puppeteer = require('puppeteer-core');
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
  const main_url = 'https://us.britax.com/';
  const cat_url = ['shop/car-seats/rear-facing-only', 'shop/car-seats/rear-facing-forward-facing', 'shop/car-seats/forward-facing-only']
  const cat = ['Infant', 'Convertible', 'Booster']
  const brand_name = 'Britax';
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
  })()
    .then(() => response.send("Complete!"));

  //Scrape function
  async function scrape(url) {
    const timer = 100
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
    console.log('Scraping ' + url)
    await page.goto(url);
    await page.waitForSelector('article.product-card');

    let prods = await page.evaluate(() => {
      let items = document.body.querySelectorAll('article.product-card')
      let _items = Object.values(items).map(em => {
        let _img_url = em.querySelector('a.product-card__link').querySelector('source').getAttribute('data-srcset');
        let split_pos = _img_url.search(' 1x,');
        return {
          item_id: em.querySelector('h1.product-card__title').textContent.trim(),
          prod_id: null,
          name: em.querySelector('h1.product-card__title').textContent.trim(),
          prod_url: em.querySelector('a.product-card__link').getAttribute('href'),
          img_url: _img_url.slice(0, split_pos),
          price: em.querySelector('div.product-card__inner').querySelector('div.items-center').querySelectorAll('span')[1].textContent.trim(),
        }
      })
      return _items;
    })

    await browser.close()
    return prods;
  }
});
// -----------------------------------------------------------------------

// ------- Safety 1st ----------
exports.safety1st = functions.https.onRequest((request, response) => {

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
  const main_url = 'https://www.safety1st.com/';
  const cat_url = ['products/in-the-car/infant-car-seats.html', 'products/in-the-car/convertible-car-seats.html', 'products/in-the-car/booster-seats.html']
  const cat = ['Infant', 'Convertible', 'Booster']
  const brand_name = 'Safety 1st';
  const status = 'active';

  //Call scrape + query
  (async () => {
    for (let i = 0; i < cat_url.length; i++) {
      let search_url = main_url + cat_url[i];
      let prod_list = await scrape(search_url);
      for (prod of prod_list) {
        prod.brand = brand_name;
        prod.status = status;
        prod.category = cat[i]
        prod.timestamp = Date.now();
      }
      console.log(prod_list)
      utils.addOrUpdate(client, q, prod_list);
    }
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
          item_id: "safety1st-" + em.querySelector('div.price-box').getAttribute('data-product-id'),
          name: em.querySelector('img.product-image-photo').getAttribute('alt'),
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

// ------- Nuna ----------
exports.nuna = functions.https.onRequest((request, response) => {

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
  const main_url = 'https://nunababy.com/usa/';
  const cat_url = ['car-seats/infant', 'car-seats/convertible', 'car-seats/all-in-one-convertible', 'car-seats/booster']
  const cat = ['Infant', 'Convertible', 'All-in-One', 'Booster']
  const brand_name = 'Nuna';
  const status = 'active';

  //Call scrape + query
  (async () => {
    for (let i = 0; i < cat_url.length; i++) {
      let search_url = main_url + cat_url[i];
      let prod_list = await scrape(search_url);
      for (prod of prod_list) {
        prod.brand = brand_name;
        prod.status = status;
        prod.category = cat[i]
        prod.timestamp = Date.now();
      }
      // console.log(prod_list)
      utils.addOrUpdate(client, q, prod_list);
    }
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
          item_id: "nuna-" + em.querySelector('div.price-box').getAttribute('data-product-id'),
          name: em.querySelector('img.product-image-photo').getAttribute('alt'),
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

// ------- Maxi-Cosi ----------
exports.maxiCosi = functions.https.onRequest((request, response) => {
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
  const main_url = 'https://www.maxicosi.com/';
  const cat_url = ['us-en/products/car-seats.html?cat=396', 'us-en/products/car-seats.html?cat=393', 'us-en/products/car-seats.html?cat=402']
  const cat = ['Infant', 'Convertible', 'Booster']
  const brand_name = 'Maxi-Cosi';
  const status = 'active';

  //Call scrape + query
  (async () => {
    for (let i = 0; i < cat_url.length; i++) {
      let search_url = main_url + cat_url[i];
      let prod_list = await scrape(search_url);
      for (prod of prod_list) {
        prod.brand = brand_name;
        prod.status = status;
        prod.category = cat[i]
        prod.timestamp = Date.now();
      }
      // console.log(prod_list)
      utils.addOrUpdate(client, q, prod_list);
    }
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
          item_id: "maxicosi-" + em.querySelector('div.price-box').getAttribute('data-product-id'),
          name: em.querySelector('a.product-item-link').textContent.trim(),
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

// ------- Evenflo ----------
exports.evenflo = functions.runWith({ memory: '2GB' }).https.onRequest((request, response) => {
  require('dotenv').config()
  const faunadb = require('faunadb')
  const q = faunadb.query
  const chromium = require('chrome-aws-lambda');
  const puppeteer = require('puppeteer-core');
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
  })()
    .then(() => response.send("Complete!"));

  //Scrape function
  async function scrape(url) {
    const timer = 100
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
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
          item_id: 'evenflo-' + em.querySelector('div.info').querySelector('span').getAttribute('data-id'),
          prod_id: em.querySelector('div.info').querySelector('span').getAttribute('data-id'),
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
});