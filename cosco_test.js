const fetch = require('cross-fetch');
const { JSDOM } = require('jsdom');

async function scrape() {

  const search_url = 'https://www.coscokids.com/products/car-seats.html';

  const response = await fetch(search_url).then(response => response.text()).then(data => {

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

};