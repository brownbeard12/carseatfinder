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

  module.exports = {
    addOrUpdate
  }