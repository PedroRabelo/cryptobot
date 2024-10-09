const settingsRepository = require('../repositories/settingsRepository');
const beholder = require('../beholder');

async function getBalance(req, res, next) {
  const id = res.locals.token.id;
  const settings = await settingsRepository.getSettingsDecrypted(id);

  const exchange = require('../utils/exchange')(settings);

  const info = await exchange.balance();

  const usd = Object.entries(info)
    .map(prop => {
      let available = parseFloat(prop[1].available);
      if (available > 0) available = beholder.tryUSDConversion(prop[0], available);

      let onOrder = parseFloat(prop[1].onOrder);
      if (onOrder > 0) onOrder = beholder.tryUSDConversion(prop[0], onOrder);

      return available + onOrder;
    })
    .reduce((prev, curr) => prev + curr);

  info.usdEstimate = usd.toFixed(2);

  res.json(info);
}

async function getCoins(req, res, next) {
  const id = res.locals.token.id;
  const settings = await settingsRepository.getSettingsDecrypted(id);
  const exchange = require('../utils/exchange')(settings);
  const coins = await exchange.getCoins();
  res.json(coins);
}

module.exports = {
  getBalance,
  getCoins
}