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
})();

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