const fetch = require('cross-fetch');
const { JSDOM } = require('jsdom');

async function scrape() {

  const search_url = 'https://www.coscokids.com/products/car-seats.html';
  let prods = []

  const response = await fetch(search_url).then(response => response.text()).then(data => {

      const doc = new JSDOM(data);

      const items = doc.window.document.querySelectorAll("li.product-item");

      let _items = Object.values(items).map(em => {
        return {
          prod_url: em.querySelector('a.product-item-link').getAttribute('href'),
          // item_id: 
          // prod_id: 
          // name: 
          // category: 
          // img_url: 
          // price: 
        }
      })
      
      return _items;
  });
  console.log(response)
};

scrape();