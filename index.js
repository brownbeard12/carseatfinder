require('dotenv').config()
const faunadb = require('faunadb')
const q = faunadb.query

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

const test_data = {
  brand: 'test1',
  model: 'model1'
}

client.query(
  q.Create(
    q.Collection('car_seats'),
    { data: test_data }
  )
)
  .catch((err) => console.log(err))