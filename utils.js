async function addOrUpdate(client, q, prod_data) {
  await client.query(
    q.Map(prod_data,
      q.Lambda('item',
        q.Let(
          {
            itemId: q.Select(['item_id'], q.Var('item')),
            itemPrice: q.Select(['price'], q.Var('item')),
            itemTS: q.Select(['timestamp'], q.Var('item'))
          },
          q.If(
            q.Exists(q.Match(q.Index('products'), q.Var('itemId'))),
            q.Map(
              q.Paginate(
                q.Match(q.Index('products'), q.Var('itemId'))
              ),
              q.Lambda(
                'item',
                q.Update(
                  q.Select('ref', q.Get(q.Var('item'))),
                  {
                    data: {
                      price: q.Var('itemPrice'),
                      status: 'active',
                      timestamp: q.Var('itemTS')
                    }
                  }
                )
              )
            ),
            q.Create(
              q.Collection('car_seats'),
              { data: q.Var('item') }
            )
          )
        )
      )
    )
  )
    //.then(item => console.log(item))
    .catch((err) => console.log(err))
}

//Scrape function
async function scrape(pup, obj) {
  const timer = 100;
  let search_url = obj.main_url + obj.cat_url;
  const browser = await pup.launch({ headless: false, args: ['--no-sandbox'] })
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
  console.log('Scraping ' + search_url);
  await page.goto(search_url, {
    waitUntil: 'load',
    timeout: 0,
  });

  let prods = await page.evaluate(obj => {
    let items = document.body.querySelectorAll(obj.all_sel);
    let _items = Object.values(items).map(em => {
      // let item_json = JSON.parse(em.getAttribute('data-analytics-data'));
      return {
        // prod_url: item_url,
        // prod_id: item_json['product_sku'],
        // item_id: item_json['id'],
        // name: item_json['name'],
        img_url: em.querySelector(obj.img_url[0]).querySelector(obj.img_url[1]).querySelector(obj.img_url[2]).getAttribute(obj.img_url[3]),
        // price: item_json['price'],
      }
    })
    return _items;
  });
  await browser.close()
  return prods;
}


module.exports = {
  addOrUpdate,
  scrape
}