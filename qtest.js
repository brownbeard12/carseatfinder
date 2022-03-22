require('dotenv').config()
const faunadb = require('faunadb')
const q = faunadb.query
const pup = require('puppeteer');
const utils = require('./utils.js')


//Setup scrape object
const tgt = {
  main_url: 'https://store.diono.com/car-seats/',
  cat_url: ['all-in-one-convertibles/'/*, 'boosters/'*/],
  brand_name: 'Diono',
  prod_status: 'active',
  all_sel: 'article.product-card',
  img_url: ['div.product-card__figure', 'a.product-card__image', 'img', 'src'],
};


//Call scrape + query
(async () => {
  for (let i = 0; i < tgt.cat_url.length; i++) {
    let prod_list = await utils.scrape(pup, tgt);
    // for (prod of prod_list) {
    //   prod.brand = brand_name;
    //   prod.status = prod_status;
    //   prod.category = cat[i];
    //   prod.timestamp = Date.now();
    // }
    console.log(prod_list);
    // utils.addOrUpdate(client, q, prod_list);
  }
})();