const orderModel = require('../models/orderModel');
const Sequelize = require('sequelize');
const automationModel = require('../models/automationModel')

const PAGE_SIZE = 10

const orderStatus = {
  FILLED: 'FILLED',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  CANCELED: 'CANCELED',
  REJECTED: 'REJECTED',
  NEW: 'NEW'
}

const orderTypes = {
  STOP_LOSS: 'STOP_LOSS',
  STOP_LOSS_LIMIT: 'STOP_LOSS_LIMIT',
  TAKE_PROFIT: 'TAKE_PROFIT',
  TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT',
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  ICEBERG: 'ICEBERG',
  TRAILING_STOP: 'TRAILING_STOP'
}

function getReportOrders(quoteAsset, startDate, endDate) {
  startDate = startDate ? startDate : 0;
  endDate = endDate ? endDate : Date.now();
  return orderModel.findAll({
    where: {
      symbol: { [Sequelize.Op.like]: `%${quoteAsset}` },
      transactTime: { [Sequelize.Op.between]: [startDate, endDate] },
      status: 'FILLED',
      net: { [Sequelize.Op.gt]: 0 }
    },
    order: [['transactTime', 'ASC']],
    include: automationModel,
    raw: true
  })
}

function getOrders(symbol, page = 1) {
  const options = {
    where: {},
    order: [['updatedAt', 'DESC']],
    limit: PAGE_SIZE,
    offset: PAGE_SIZE * (page - 1),
    distinct: true
  };

  if (symbol) {
    if (symbol.length < 6)
      options.where = { symbol: { [Sequelize.Op.like]: `%${symbol}%` } }
    else
      options.where = { symbol }
  }

  options.include = automationModel;

  return orderModel.findAndCountAll(options);
}

function insertOrder(newOrder) {
  return orderModel.create(newOrder);
}

function getOrderById(id) {
  return orderModel.findByPk(id);
}

function getOrder(orderId, clientOrderId) {
  return orderModel.findOne({ where: { orderId, clientOrderId }, include: automationModel });
}

async function updateOrderById(id, newOrder) {
  const order = await getOrderById(id);
  return updateOrder(order, newOrder);
}

async function updateOrderByOrderId(orderId, clientOrderId, newOrder) {
  const order = await getOrder(orderId, clientOrderId);
  return updateOrder(order, newOrder);
}

async function getLastFilledOrders() {
  const idObjects = await orderModel.findAll({
    where: { status: 'FILLED' },
    group: 'symbol',
    attributes: [Sequelize.fn('max', Sequelize.col('id'))],
    raw: true
  })
  const ids = idObjects.map(o => Object.values(o)).flat();

  return orderModel.findAll({ where: { id: ids } });
}

async function removeAutomationFromOrders(automationId, transaction) {
  return orderModel.update({
    automationId: null
  }, {
    where: { automationId },
    transaction
  })
}

async function updateOrder(currentOrder, newOrder) {
  if (!currentOrder || !newOrder) return false;

  if (newOrder.status &&
    newOrder.status !== currentOrder.status &&
    (currentOrder.status === orderStatus.NEW || currentOrder.status === orderStatus.PARTIALLY_FILLED))
    currentOrder.status = newOrder.status;//somente dá para atualizar ordens não finalizadas

  if (newOrder.avgPrice && newOrder.avgPrice !== currentOrder.avgPrice)
    currentOrder.avgPrice = newOrder.avgPrice;

  if (newOrder.isMaker !== null && newOrder.isMaker !== undefined && newOrder.isMaker !== currentOrder.isMaker)
    currentOrder.isMaker = newOrder.isMaker;

  if (newOrder.obs !== null && newOrder.obs !== undefined
    && newOrder.obs !== currentOrder.obs)
    currentOrder.obs = newOrder.obs;

  if (newOrder.transactTime && newOrder.transactTime !== currentOrder.transactTime)
    currentOrder.transactTime = newOrder.transactTime;

  if (newOrder.commission !== null && newOrder.commission !== undefined
    && newOrder.commission !== currentOrder.commission)
    currentOrder.commission = newOrder.commission;

  if (newOrder.net !== null && newOrder.net !== undefined
    && newOrder.net !== currentOrder.net)
    currentOrder.net = newOrder.net;

  if (newOrder.quantity && newOrder.quantity !== currentOrder.quantity)
    currentOrder.quantity = newOrder.quantity;

  await currentOrder.save();
  return currentOrder;
}

const STOP_TYPES = [orderTypes.STOP_LOSS, orderTypes.STOP_LOSS_LIMIT, orderTypes.TAKE_PROFIT, orderTypes.TAKE_PROFIT_LIMIT];

const LIMIT_TYPES = [orderTypes.LIMIT, orderTypes.STOP_LOSS_LIMIT, orderTypes.TAKE_PROFIT_LIMIT];

module.exports = {
  STOP_TYPES,
  LIMIT_TYPES,
  orderTypes,
  getReportOrders,
  insertOrder,
  getOrderById,
  getOrder,
  updateOrderById,
  updateOrderByOrderId,
  getOrders,
  getLastFilledOrders,
  removeAutomationFromOrders
}