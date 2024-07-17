const ordersRepository = require('../repositories/ordersRepository');

async function getOrders(req, res, next) {
  const symbol = req.params.symbol && req.params.symbol.toUpperCase();
  const page = parseInt(req.query.page);
  const orders = await ordersRepository.getOrders(symbol, page || 1);
  res.json(orders);
}

async function placeOrder(req, res, next) {
  const { side, symbol, quantity, price, type, options, automationId } = req.body;

  const order = await ordersRepository.insertOrder({
    automationId,
    symbol,
    quantity,
    type,
    side,
    limitPrice: price,
    stopPrice: options ? options.stopPrice : null,
    icebergQuantity: options ? options.icebergQty : null,
    orderId: 1,
    clientOrderId: 'a',
    transactTime: Date.now(),
    status: 'NEW'
  })

  res.status(201).json(order.get({ plain: true }));
}

async function cancelOrder(req, res, next) {
  res.sendStatus(200);
}

module.exports = {
  getOrders,
  placeOrder
}

// MODULO 04 LIÇÃO 2 AULA 04