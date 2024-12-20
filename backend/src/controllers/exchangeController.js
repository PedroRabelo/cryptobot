const settingsRepository = require('../repositories/settingsRepository');
const withdrawTemplatesRepository = require('../repositories/withdrawTemplatesRepository');
const ordersRepository = require('../repositories/ordersRepository');
const symbolsRepository = require('../repositories/symbolsRepository');
const usersRepository = require('../repositories/usersRepository');
const hydra = require('../hydra');

async function loadBalance(userId, fiat) {
  const user = await usersRepository.getUserDecrypted(userId);
  if (!user) return res.sendStatus(404);
  if (!user.accessKey || !user.secretKey) return res.sendStatus(400).send(`Go to settings and fill your data.`);

  const settings = await settingsRepository.getDefaultSettings();
  const exchange = require('../utils/exchange')(settings, user);
  const info = await exchange.balance();

  const coins = Object.entries(info).map(p => p[0]);
  let total = 0;
  await Promise.all(coins.map(async (coin) => {
    let available = parseFloat(info[coin].available);
    if (available > 0) available = hydra.tryFiatConversion(coin, available, fiat);

    let onOrder = parseFloat(info[coin].onOrder);
    if (onOrder > 0) onOrder = hydra.tryFiatConversion(coin, onOrder);

    info[coin].fiatEstimate = available + onOrder;
    total += available + onOrder;
  }))

  info.fiatEstimate = "~" + fiat + total.toFixed(2);
  return info;
}

async function getBalance(req, res, next) {
  const userId = res.locals.token.id;
  const fiat = req.params.fiat;

  try {
    const info = await loadBalance(userId, fiat); tem
    res.json(info);
  } catch (err) {
    console.error(err.response ? err.response.data : err);
    res.status(500).send(err.response ? err.response.data : err.message)
  }
}

async function getFullBalance(req, res, next) {
  const id = res.locals.token.id;
  const fiat = req.params.fiat;

  try {
    const info = await loadBalance(id, fiat);

    const averages = await ordersRepository.getAveragePrices();
    const symbols = await symbolsRepository.getManySymbols(averages.map(a => a.symbol));

    let symbolsObj = {};
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      symbolsObj[symbol.symbol] = { base: symbol.base, quote: symbol.quote };
    }

    const grouped = {};
    for (let i = 0; averages.length; i++) {
      const averageObj = averages[i];
      const symbol = symbolsObj[averageObj.symbol];

      if (symbol.quote !== fiat) {
        averageObj.avg = hydra.tryFiatConversion(symbol.quote, parseFloat(averageObj.avg), fiat);
        averageObj.net = hydra.tryFiatConversion(symbol.quote, parseFloat(averageObj.net), fiat);
      }
      averageObj.symbol = symbol.base;

      if (!grouped[symbol.base]) grouped[symbol.base] = { net: 0, qty: 0 };
      grouped[symbol.base].net += averageObj.net;
      grouped[symbol.base].qty += averageObj.qty;
    }

    const coins = [...new Set(averages.map(a => a.symbol))];
    coins.map(coin => info[coin].avg = grouped[coin].net / grouped[coin].qty);

    res.json(info);
  } catch (err) {
    console.error(err.response ? err.response.data : err);
    res.status(500).send(err.response ? err.response.data : err.message)
  }
}

async function getCoins(req, res, next) {
  const userId = res.locals.token.id;
  const user = await usersRepository.getUserDecrypted(userId);
  if (!user) return res.sendStatus(404);
  if (!user.accessKey || !user.secretKey) return res.sendStatus(400).send(`Go to settings and fill your data.`);

  const settings = await settingsRepository.getDefaultSettings();
  const exchange = require('../utils/exchange')(settings, user);
  const coins = await exchange.getCoins();
  res.json(coins);
}

async function doWithdraw(req, res, next) {
  const userId = res.locals.token.id;
  const withdrawTemplateId = req.params.id;
  if (!withdrawTemplateId) return res.sendStatus(404);

  const withdrawTemplate = await withdrawTemplatesRepository.getWithdrawTemplate(userId, withdrawTemplateId);
  if (!withdrawTemplate) return res.sendStatus(404);
  if (withdrawTemplate.userId !== userId) return res.sendStatus(403);

  let amount = parseFloat(withdrawTemplate.amount);
  if (!amount) {
    if (withdrawTemplate.amount === 'MAX_WALLET') {
      const available = hydra.getMemory(withdrawTemplate.coin, `WALLET_${userId}`, null);
      if (!available) return res.status(400).json(`No available funds for this coin.`);

      amount = available * (withdrawTemplate.amountMultiplier > 1 ? 1 : withdrawTemplate.amountMultiplier);

    } else if (withdrawTemplate.amount === 'LAST_ORDER_QTY') {
      const keys = hydra.searchMemory(new RegExp(`^((${withdrawTemplate.coin}.+|.+${withdrawTemplate.coin}):LAST_ORDER_${userId})$`));
      if (!keys || !keys.length) return res.status(400).json(`No Last order for this coin.`);

      amount = keys[keys.length - 1].value.quantity * withdrawTemplate.amountMultiplier;
    }
  }

  const user = await usersRepository.getUserDecrypted(userId);
  const settings = await settingsRepository.getDefaultSettings();
  const exchange = require('../utils/exchange')(settings, user);

  try {
    const result = await exchange.withdraw(withdrawTemplate.coin, amount, withdrawTemplate.address, withdrawTemplate.network, withdrawTemplate.addressTag);
    res.json(result);
  } catch {
    res.status(400).json(err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

module.exports = {
  getBalance,
  getFullBalance,
  getCoins,
  doWithdraw,
}