
// Check if item exists, add to db or update existing entry

async function addOrUpdate(client, q, prod_data) {
  await client.query(
    q.Map(prod_data,
      q.Lambda('item',
        q.Let(
          {
            itemId: q.Select(['item_id'], q.Var('item')),
            itemPrice: q.Select(['price'], q.Var('item')),
            itemTS: q.Select(['timestamp'], q.Var('item')),
            itemImgUrl: q.Select(['img_url'], q.Var('item'))
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
                      img_url: q.Var('itemImgUrl'),
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

// Update status to 'inactive' if entry not updated for 3 or more days
async function updateStatus(client, q) {
  await client.query(
    q.Map(
      q.Paginate(q.Range(q.Match(q.Index("ts")), [], [q.Subtract(q.ToMillis(q.Now()), 260000000)])),
      q.Lambda(
        ["ts", "ref", "status"],
        q.Update(
          q.Select("ref", q.Get(q.Var("ref"))),
          {
            data:
            {
              status: 'inactive'
            }
          })
      )
    )
  )
    //.then(item => console.log(item))
    .catch((err) => console.log(err))
}

// Update status to 'inactive' if entry has zero price
async function updateStatusForZeroPrice(client, q) {
  await client.query(
    q.Map(
      q.Paginate(q.Match(q.Index("price-term"), "0")),
      q.Lambda(
        ["ref", "price"],
        q.Update(q.Var("ref"), {
          data: { status: "inactive" }
        })
      )
    )
  )
    //.then(item => console.log(item))
    .catch((err) => console.log(err))
}

module.exports = {
  addOrUpdate,
  updateStatus,
  updateStatusForZeroPrice
}