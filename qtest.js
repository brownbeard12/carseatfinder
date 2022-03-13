require('dotenv').config()
const faunadb = require('faunadb')
const q = faunadb.query

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

//Query function
const prod_data = [
  {
    item_id: '06079679980070',
    prod_id: '79679',
    name: 'KeyFit 30 Infant Car Seat - Calla',
    category: 'Infant',
    prod_url: 'https://www.chiccousa.com/shop-our-products/car-seats/infant/keyfit-30-infant-car-seat/79679.html?dwvar_79679_color=Calla&cgid=gear_car_seats_infant_car_seats',
    img_url: 'https://www.chiccousa.com/dw/image/v2/AAMT_PRD/on/demandware.static/-/Sites-chicco_catalog/default/dw1c0ce5c5/images/products/Gear/keyfit30/chicco-keyfit-30-car-seat-calla.jpg?sw=280&sh=280&sm=fit',
    price: 136.99,
    brand: 'Chicco',
    status: 'active',
    timestamp: Date.now()
  },
  {
    'item_id': '06079716620070',
    'prod_id': '79716',
    'name': 'KeyFit 35 Zip ClearTex Infant Car Seat - Reef',
    'category': 'Infant',
    'prod_url': 'https://www.chiccousa.com/shop-our-products/car-seats/infant/keyfit-35-zip-cleartex-infant-car-seat/79716.html?dwvar_79716_color=Reef&cgid=gear_car_seats_infant_car_seats',
    'img_url': 'https://www.chiccousa.com/dw/image/v2/AAMT_PRD/on/demandware.static/-/Sites-chicco_catalog/default/dw276d8060/images/products/Gear/keyfit35/chicco-keyfit-35-zip-cleartex-reef.jpg?sw=280&sh=280&sm=fit',
    'price': 198.99,
    'brand': 'Chicco',
    'status': 'active',
    'timestamp': 1647175841882
  }
]

/* client.query(
  q.Map(
    q.Paginate(
      q.Match(q.Index('products'), prod_data[0].item_id)
    ),
    q.Lambda(
      'item',
      q.Get(q.Var('item'))
    )
  )
)
  .then(item => console.log(item))
  .catch((err) => console.log(err)) */


/* client.query(
  q.Map(
    q.Paginate(
      q.Match(q.Index('products'), prod_data[0].item_id)
    ),
    q.Lambda(
      'item',
      q.Call(
        q.Function('upsert'),
        q.Select('ref', q.Get(q.Var('item'))),
        {
          data: {
            price: prod_data[0].price,
          }
        })
    )
  )
)
  .then(item => console.log(item))
  .catch((err) => console.log(err)) */

/* client.query(
  q.Map(
    q.Map(prod_data, q.Lambda('item', q.Select(['item_id'], q.Var('item')))),
    q.Lambda(
      'itemId',
      q.Map(
        q.Paginate(
          q.Match(q.Index('products'), q.Var('itemId'))
        ),
        q.Lambda(
          'item',
          q.Call(
            q.Function('upsert'),
            q.Select('ref', q.Get(q.Var('item'))),
            {
              data: {
                price: 3,
                status: 'active'
              }
            })
        )
      )
    )
  )
)
  .then(item => console.log(item))
  .catch((err) => console.log(err)) */

client.query(
  q.Map(prod_data,
    q.Lambda('item',
      q.Let(
        {
          itemId: q.Select(['item_id'], q.Var('item')),
          itemPrice: q.Select(['price'], q.Var('item')),
        },
        q.Map(
          q.Paginate(
            q.Match(q.Index('products'), q.Var('itemId'))
          ),
          q.Lambda(
            'item',
            q.Call(
              q.Function('upsert'),
              q.Select('ref', q.Get(q.Var('item'))),
              {
                data: {
                  price: q.Var('itemPrice'),
                  status: 'active'
                }
              }
            )
          )
        )
      )
    )
  )
)
  .then(item => console.log(item))
  .catch((err) => console.log(err))